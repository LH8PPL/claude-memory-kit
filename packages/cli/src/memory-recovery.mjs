// memory-recovery.mjs — the install-time memory recovery pass (Task 248).
//
// WHY THIS MODULE EXISTS
// ----------------------
// Task 246 (D-389) fixed the SOURCE of orphaned memory tiers: the capture-hook
// bins passed a bare `process.cwd()` as projectRoot, so an agent whose cwd was a
// SUBDIRECTORY forked a fresh `context/` tier there and wrote real facts into
// it, unread, while `cmk doctor` stayed green over the root tier. v0.6.2 stops
// NEW strays. It does nothing for the ones a pre-246 install already created —
// they are frozen and safe, but invisible.
//
// This module is the RECOVERY half: `cmk install` (including every re-install /
// upgrade run) scans below the project root for stray tiers and relocates their
// fact files into the root tier automatically. The user runs no command — that
// is the D-169 automatic-path criterion, and the reason this lives in the
// install flow rather than behind `cmk doctor` (U-U5PPSG7Y: users don't run
// doctor; the user's call, P-3PWCGWZH: "doctor should only be part of the fix,
// not the actual fix"). Doctor's HC-13 is the SECONDARY backstop for strays
// that appear by some other route later.
//
// THE FOUR RULES THIS PASS OBEYS
// ------------------------------
//  1. FAITHFUL RELOCATION (P-9W7XDMCA). A recovered fact is a BYTE-IDENTICAL
//     copy: its `id` and `created_at` are preserved exactly. Re-capturing the
//     content instead would re-date history and re-key the id, which is a
//     different (and wrong) fact.
//  2. NEVER DELETE (ADR-0018 / D-192 / D-193). We COPY out of the stray tier and
//     leave the husk exactly as it was, then print a platform-correct delete
//     hint. Deleting a memory path is the user's step, always.
//  3. COLLISION-SAFE. If the destination filename OR the fact id already exists
//     anywhere in the root tier — live, tombstoned, or superseded — the file is
//     SKIPPED and reported. Never overwrite, never dedupe-by-rewrite, and never
//     resurrect something the user deliberately forgot.
//  4. FAIL-OPEN. This runs on the install path, which is the highest-stakes code
//     in the kit. Any error anywhere degrades to "install proceeds exactly as
//     today, plus one warning line". Recovery can warn; it can never break an
//     install.
//
// THE D-394 SCOPE — MALFORMED / ID-LESS FACT FILES
// ------------------------------------------------
// The same pass repairs a second pre-existing corruption class. `index-rebuild`
// skips a fact file whose frontmatter has no valid `id` ("invalid or missing
// id") WITHOUT checkpointing it, so the file is re-read and re-skipped on every
// boot — a quiet per-read cost, and a fact invisible to recall. Because the
// kit's ids are CONTENT-ADDRESSED (`generateId(tier, body)` — design §3.1), a
// missing id is deterministically derivable from the body the file already
// holds. So:
//   · derivable  → repair in place through the kit's own id machinery, every
//                  other byte preserved (an insertion or a one-line swap, never
//                  a YAML round-trip, which would re-quote unrelated values).
//   · not derivable (unparseable frontmatter, no body to hash)
//                → QUARANTINE into `<factDir>/archive/quarantine/`, bytes
//                  preserved, reported. Never deleted, never silently dropped.
//
// Quarantine lives under `archive/` rather than directly under `memory/`
// deliberately: `archive/tombstones/` and `archive/superseded/` are already the
// tier's "not a live fact, still kept" area (forget.mjs, merge-facts.mjs,
// validity-window.mjs), `template/project/memory/archive/` already scaffolds the
// parent, every fact walk skips subdirectories, and `redact.mjs` already walks
// the fact dir RECURSIVELY — so a quarantined file is still covered by a leak
// scrub. A new top-level `memory/quarantine/` would have to earn all four.
//
// Shared modules only: tier-paths (paths + ID_PATTERN), fact-store (the ONE fact
// walk), frontmatter (parse), audit-log (Door 5), platform-commands (the delete
// hint), reindex (the derived index), @lh8ppl/cmk-canonicalize (id derivation).

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { canonicalize, generateId } from '@lh8ppl/cmk-canonicalize';
import { ID_PATTERN, resolveTierRoot, resolveFactDir } from './tier-paths.mjs';
import { listFactFiles, eachFactIn } from './fact-store.mjs';
import { parse } from './frontmatter.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { removeDir } from './platform-commands.mjs';
import { reindex } from './reindex.mjs';

/**
 * How many directory levels below the project root the scan looks for a stray
 * tier. FOUR, and the number is a budget, not a guess:
 *
 *   · A stray tier is created at the AGENT'S CWD. The realistic deep cwd is a
 *     monorepo package or one level inside it — `packages/cli` (2),
 *     `packages/cli/src` (3), `apps/web/src/features` (4). Depth 4 covers every
 *     shape we have seen (this repo's two real strays were at depth 1 and 2)
 *     with a level of headroom.
 *   · The cost is bounded by what it does NOT walk: `node_modules/`, `.git/` and
 *     every dot-directory, plus the usual build/vendor dirs, are pruned at the
 *     first level they appear. A four-level walk over a pruned tree is a handful
 *     of readdir calls, which is what lets this run on EVERY install.
 *   · Anything deeper is not lost — HC-13 uses the same scan, so a deeper stray
 *     is simply not detectable by either surface, and the honest answer is that
 *     the class we are recovering from cannot produce one.
 */
export const MAX_SCAN_DEPTH = 4;

/** Where a non-derivable fact file is parked. See the header note. */
export const QUARANTINE_DIRNAME = 'quarantine';

/** Directory names that map to a memory tier when found below the root. */
const TIER_BY_DIRNAME = Object.freeze({ context: 'P', 'context.local': 'L' });

/**
 * Pruned wholesale. These either cannot hold a real stray tier (a stray is
 * written at an agent's cwd, and no agent works inside `node_modules/`) or are
 * generated trees where a `context/`-shaped dir is a copy, not memory.
 * Dot-directories are pruned separately (covers `.git`, `.venv`, `.next`,
 * `.stress-logs`, `.index` …).
 */
const PRUNED_DIRS = new Set([
  'node_modules',
  'template',
  'templates',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  'venv',
  'target',
  '__pycache__',
  'site-packages',
]);

// A kit citation id inside a scratchpad bullet: `- some text (P-XXXXXXXX)`.
// Derived from the canonical ID_PATTERN (shared-module discipline — the
// alphabet is never re-spelled).
const BULLET_ID_RE = new RegExp(`\\((${ID_PATTERN.source.slice(1, -1)})\\)`, 'g');

// A synthetic, stable id for audit entries about a file that HAS no id (the
// quarantine case). Same device as install.mjs's `P-NSTLHKWR`; base32 alphabet.
const QUARANTINE_AUDIT_ID = 'P-QRNTNDFL';

/* ------------------------------------------------------------------ */
/* the scan                                                            */
/* ------------------------------------------------------------------ */

function safeReaddir(dir) {
  try {
    return readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function fileHasContent(path) {
  try {
    return statSync(path).isFile() && readFileSync(path, 'utf8').trim().length > 0;
  } catch {
    return false;
  }
}

function countFilesIn(dir) {
  let n = 0;
  for (const entry of safeReaddir(dir)) {
    if (entry.isFile() && fileHasContent(join(dir, entry.name))) n += 1;
  }
  return n;
}

function countMemoryBullets(tierRoot) {
  try {
    const text = readFileSync(join(tierRoot, 'MEMORY.md'), 'utf8');
    return (text.match(BULLET_ID_RE) ?? []).length;
  } catch {
    return 0;
  }
}

/**
 * Describe a candidate tier: is it LIVE state, or a template scaffold?
 *
 * The discriminator (the same one Task 246's scan used): a scaffold has an
 * unpopulated `memory/INDEX.md` and an empty `sessions/`. A tier that a capture
 * hook actually wrote to has at least one of — a fact file, a non-empty
 * `sessions/now.md`, an INDEX.md that lists entries, or another populated
 * surface. Anything with none of those is scaffold, and must not be touched.
 */
function describeTier(tierRoot, tier) {
  const factDir = resolveFactDir(tier, tierRoot);
  const factFiles = listFactFiles(factDir);
  const indexPath = join(factDir, 'INDEX.md');
  let indexEntries = 0;
  try {
    indexEntries = (readFileSync(indexPath, 'utf8').match(BULLET_ID_RE) ?? []).length;
  } catch {
    // no INDEX.md, or unreadable — not a liveness signal either way
  }
  const nonFact = {
    memoryBullets: countMemoryBullets(tierRoot),
    sessionFiles: countFilesIn(join(tierRoot, 'sessions')),
    transcriptFiles: countFilesIn(join(tierRoot, 'transcripts')),
    queueFiles: countFilesIn(join(tierRoot, 'queues')),
  };
  const live =
    factFiles.length > 0 ||
    indexEntries > 0 ||
    nonFact.memoryBullets > 0 ||
    nonFact.sessionFiles > 0 ||
    nonFact.transcriptFiles > 0 ||
    nonFact.queueFiles > 0;
  return { tierRoot, tier, factDir, factFiles, factCount: factFiles.length, nonFact, live };
}

/**
 * Find stray `context/` / `context.local/` tiers BELOW the project root.
 *
 * Cheap by construction (pruned walk, `MAX_SCAN_DEPTH`) and fail-open: any error
 * is collected into `errors` and the scan returns what it found, never throws.
 * The root tiers themselves are never candidates.
 *
 * @param {object} o
 * @param {string} o.projectRoot
 * @param {number} [o.maxDepth=MAX_SCAN_DEPTH]
 * @returns {{strays: object[], errors: string[]}}
 */
export function scanStrayTiers({ projectRoot, maxDepth = MAX_SCAN_DEPTH } = {}) {
  const strays = [];
  const errors = [];
  if (!projectRoot) return { strays, errors: ['scanStrayTiers: projectRoot is required'] };

  const visit = (dir, depth) => {
    for (const entry of safeReaddir(dir)) {
      if (!entry.isDirectory()) continue; // symlinks report false — deliberately not followed
      const name = entry.name;
      const full = join(dir, name);
      const tier = TIER_BY_DIRNAME[name];
      if (tier) {
        // depth 0 is the project root itself: its `context/` IS the root tier.
        // Never a candidate, and never descended into.
        if (depth === 0) continue;
        try {
          const described = describeTier(full, tier);
          if (described.live) strays.push(described);
        } catch (err) {
          errors.push(`stray scan: ${full}: ${err?.message ?? err}`);
        }
        continue;
      }
      if (name.startsWith('.') || PRUNED_DIRS.has(name)) continue;
      if (depth + 1 < maxDepth) visit(full, depth + 1);
    }
  };

  try {
    visit(projectRoot, 0);
  } catch (err) {
    errors.push(`stray scan: ${err?.message ?? err}`);
  }
  return { strays, errors };
}

/* ------------------------------------------------------------------ */
/* malformed / id-less fact files (D-394)                              */
/* ------------------------------------------------------------------ */

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/**
 * Classify a fact file's id: already valid, repairable (content-addressed), or
 * not derivable. Pure — takes the file text, returns a verdict.
 *
 * @param {string} text raw file contents
 * @param {'P'|'L'|'U'} tier
 */
export function classifyFactId(text, tier) {
  const { frontmatter, body, parseError } = parse(stripBom(text));
  if (!frontmatter || parseError) {
    return { kind: 'not-derivable', reason: parseError ?? 'no parseable frontmatter' };
  }
  const raw = frontmatter.id;
  const current = raw === undefined || raw === null ? null : String(raw);
  if (current !== null && ID_PATTERN.test(current)) return { kind: 'valid', id: current };
  if (canonicalize(body).length === 0) {
    return { kind: 'not-derivable', reason: 'empty body — no content to derive an id from' };
  }
  return { kind: 'repairable', id: generateId(tier, body), previousId: current };
}

/**
 * Write the derived id into the frontmatter, preserving EVERY other byte.
 *
 * A YAML round-trip (`format(parse(text))`) would re-quote and re-order
 * unrelated values, which is exactly what faithful-relocation forbids — so this
 * is a textual edit: an INSERT after the opening `---` when the id was missing,
 * or a one-line SWAP (keeping the old value as `legacy_id`, so a citation of the
 * old id still greps to this file) when the id was present but outside the kit's
 * alphabet. BOM and CRLF are preserved as found.
 *
 * @returns {string|null} the repaired text, or null when the shape is not
 *   what we expected (caller quarantines rather than guessing).
 */
export function applyIdRepair(text, { id, previousId }) {
  const bom = text.charCodeAt(0) === 0xfeff ? String.fromCharCode(0xfeff) : '';
  const rest = bom ? text.slice(1) : text;
  const m = rest.match(/^---(\r?\n)([\s\S]*?)(?=\r?\n---)/);
  if (!m) return null;
  const eol = m[1];
  const fmText = m[2];
  const head = `---${eol}`;
  let nextFm;
  if (previousId === null) {
    nextFm = `id: ${id}${eol}${fmText}`;
  } else {
    const idLine = /^id:[^\r\n]*$/m;
    if (!idLine.test(fmText)) return null;
    nextFm = fmText.replace(idLine, `id: ${id}${eol}legacy_id: ${previousId}`);
  }
  return bom + head + nextFm + rest.slice(head.length + fmText.length);
}

/**
 * Where a file gets parked, and whether it needs parking at all.
 *
 * Two callers with different needs, so this answers BOTH questions at once:
 * the ROOT pass MOVES (the source disappears, so a name is free the next run),
 * but the STRAY pass COPIES (the husk keeps its file, so the same broken file is
 * seen again on every install). Without the `alreadyThere` verdict that second
 * caller would quarantine a fresh `name.1.md`, `name.2.md`, … on every re-run —
 * the exact non-idempotency the copy semantics are otherwise designed to avoid.
 * Identity is by BYTES, so a genuinely different file that happens to share a
 * name still gets its own numbered slot instead of being silently swallowed.
 *
 * @returns {{dest: string, alreadyThere: boolean}}
 */
function quarantineSlotFor(factDir, filename, bytes) {
  const dir = join(factDir, 'archive', QUARANTINE_DIRNAME);
  let dest = join(dir, filename);
  let n = 1;
  while (existsSync(dest)) {
    if (bytes !== undefined) {
      try {
        if (readFileSync(dest).equals(bytes)) return { dest, alreadyThere: true };
      } catch {
        // unreadable existing slot — fall through to the next numbered name
      }
    }
    dest = join(dir, filename.replace(/\.md$/, `.${n}.md`));
    n += 1;
  }
  return { dest, alreadyThere: false };
}

/** Move a file, bytes preserved, with a copy+unlink fallback for cross-device. */
function moveFilePreservingBytes(from, to) {
  mkdirSync(join(to, '..'), { recursive: true });
  try {
    renameSync(from, to);
  } catch {
    writeFileSync(to, readFileSync(from));
    unlinkSync(from);
  }
}

function auditQuietly(tierRoot, entry) {
  try {
    appendAuditEntry(tierRoot, entry);
  } catch {
    // Door 5 is best-effort on this path: the bytes are already where they
    // belong, and an audit hiccup must never fail an install.
  }
}

/**
 * Repair (or quarantine) every malformed fact file in ONE fact dir, in place.
 * Used for the ROOT tiers — a stray tier's malformed files are repaired on their
 * way OUT instead (we never rewrite the husk the user is about to delete).
 */
function repairFactDir({ factDir, tier, tierRoot }) {
  const repaired = [];
  const quarantined = [];
  const errors = [];
  for (const filename of listFactFiles(factDir)) {
    const path = join(factDir, filename);
    let text;
    try {
      text = readFileSync(path, 'utf8');
    } catch (err) {
      quarantined.push({ filename, from: path, to: null, reason: `unreadable: ${err?.message ?? err}` });
      continue;
    }
    const verdict = classifyFactId(text, tier);
    if (verdict.kind === 'valid') continue;
    if (verdict.kind === 'repairable') {
      const next = applyIdRepair(text, verdict);
      if (next !== null) {
        try {
          // Guarded: an unwritable file (read-only bit, an editor lock) must
          // cost only ITS repair, not the rest of the pass — this loop is the
          // last thing standing between a corrupt neighbour and every other
          // file's fix.
          writeFileSync(path, next, 'utf8');
        } catch (err) {
          errors.push(`fact-id repair (${path}): ${err?.message ?? err}`);
          continue;
        }
        repaired.push({ filename, path, id: verdict.id, previousId: verdict.previousId });
        auditQuietly(tierRoot, {
          ts: nowIso(),
          action: 'fact-id-repaired',
          tier,
          id: verdict.id,
          reasonCode: REASON_CODES.FACT_ID_REPAIRED,
          paths: { before: path, after: path },
          extra: { previousId: verdict.previousId },
        });
        continue;
      }
      // shape we could not edit safely — fall through to quarantine
    }
    // A MOVE, so the source name frees up: no bytes-identity check needed here
    // (that is the stray COPY path's problem — see quarantineSlotFor).
    const { dest } = quarantineSlotFor(factDir, filename);
    try {
      moveFilePreservingBytes(path, dest);
    } catch (err) {
      quarantined.push({ filename, from: path, to: null, reason: `move failed: ${err?.message ?? err}` });
      continue;
    }
    quarantined.push({ filename, from: path, to: dest, reason: verdict.reason ?? 'unrepairable frontmatter' });
    auditQuietly(tierRoot, {
      ts: nowIso(),
      action: 'fact-quarantined',
      tier,
      id: QUARANTINE_AUDIT_ID,
      reasonCode: REASON_CODES.FACT_QUARANTINED,
      paths: { before: path, after: dest },
      extra: { filename, reason: verdict.reason ?? 'unrepairable frontmatter' },
    });
  }
  return { repaired, quarantined, errors };
}

/* ------------------------------------------------------------------ */
/* the root tier's id + filename census                                */
/* ------------------------------------------------------------------ */

/**
 * Every id the root tier already knows — live facts AND the archive.
 *
 * The archive half is load-bearing: `archive/tombstones/` holds facts the user
 * DELIBERATELY forgot, and `archive/superseded/` holds facts a merge retired.
 * Copying a stray twin of either back into `memory/` would silently resurrect a
 * forget — the worst outcome this pass could produce.
 */
function rootIdCensus(factDir) {
  const ids = new Set();
  for (const fact of eachFactIn(factDir)) ids.add(fact.id);
  for (const sub of ['tombstones', 'superseded', QUARANTINE_DIRNAME]) {
    for (const fact of eachFactIn(join(factDir, 'archive', sub))) ids.add(fact.id);
  }
  return ids;
}

/* ------------------------------------------------------------------ */
/* the public boundary                                                 */
/* ------------------------------------------------------------------ */

/**
 * The install-time recovery pass. ONE call; every failure mode is inside.
 *
 * @param {object} o
 * @param {string} o.projectRoot
 * @param {string} [o.userDir]        unused today (the U tier is not stray-prone —
 *                                    it has no project-relative fork path); accepted
 *                                    so the boundary matches every other tier walker.
 * @param {Function} [o._scanFn]      test seam
 * @param {Function} [o._reindexFn]   test seam
 * @returns {{action:'completed'|'error', strays:object[], repaired:object[],
 *            quarantined:object[], reindexed:string[], errors:string[]}}
 */
export function recoverMemory({ projectRoot, _scanFn, _reindexFn } = {}) {
  const report = {
    action: 'completed',
    strays: [],
    repaired: [],
    quarantined: [],
    reindexed: [],
    errors: [],
  };
  try {
    const scan = (_scanFn ?? scanStrayTiers)({ projectRoot });
    report.errors.push(...(scan.errors ?? []));

    const touched = new Set();

    // 1. Root tiers first — repairing an id here means the census below sees it,
    //    so a stray twin of a just-repaired fact collision-skips correctly.
    for (const tier of ['P', 'L']) {
      const tierRoot = resolveTierRoot({ tier, projectRoot });
      const factDir = resolveFactDir(tier, tierRoot);
      if (!existsSync(factDir)) continue;
      const r = repairFactDir({ factDir, tier, tierRoot });
      report.repaired.push(...r.repaired.map((x) => ({ ...x, tier })));
      report.quarantined.push(...r.quarantined.map((x) => ({ ...x, tier })));
      report.errors.push(...r.errors);
      if (r.repaired.length > 0 || r.quarantined.length > 0) touched.add(tier);
    }

    // 2. Each stray tier: copy its facts into the matching root tier.
    for (const stray of scan.strays ?? []) {
      const entry = recoverOneStray({ stray, projectRoot });
      report.strays.push(entry);
      report.errors.push(...entry.errors);
      if (entry.recovered.length > 0) touched.add(stray.tier);
    }

    // 3. One reindex per tier we actually changed. Skipped entirely when nothing
    //    moved, which is what keeps a re-install byte-idempotent.
    const doReindex = _reindexFn ?? reindex;
    for (const tier of touched) {
      try {
        doReindex({ tier, projectRoot, warn: () => {} });
        report.reindexed.push(tier);
      } catch (err) {
        report.errors.push(`reindex(${tier}) after recovery: ${err?.message ?? err}`);
      }
    }
  } catch (err) {
    // FAIL-OPEN. Whatever went wrong, the install continues; the caller prints
    // one warning line and nothing else changes.
    return {
      action: 'error',
      strays: [],
      repaired: [],
      quarantined: [],
      reindexed: [],
      errors: [`memory recovery: ${err?.message ?? err}`],
    };
  }
  return report;
}

function recoverOneStray({ stray, projectRoot }) {
  const rootTierRoot = resolveTierRoot({ tier: stray.tier, projectRoot });
  const rootFactDir = resolveFactDir(stray.tier, rootTierRoot);
  const entry = {
    tierRoot: stray.tierRoot,
    tier: stray.tier,
    relPath: relative(projectRoot, stray.tierRoot).replaceAll('\\', '/'),
    recovered: [],
    skipped: [],
    nonFact: stray.nonFact,
    deleteHint: removeDir(stray.tierRoot),
    errors: [],
  };

  let ids;
  try {
    mkdirSync(rootFactDir, { recursive: true });
    ids = rootIdCensus(rootFactDir);
  } catch (err) {
    entry.errors.push(`recovery census (${stray.tierRoot}): ${err?.message ?? err}`);
    return entry;
  }

  for (const filename of stray.factFiles) {
    const from = join(stray.factDir, filename);
    const to = join(rootFactDir, filename);
    let text;
    try {
      text = readFileSync(from, 'utf8');
    } catch (err) {
      entry.errors.push(`recovery read (${from}): ${err?.message ?? err}`);
      continue;
    }

    const verdict = classifyFactId(text, stray.tier);
    let outText = text;
    let id = verdict.id ?? null;
    if (verdict.kind === 'repairable') {
      const next = applyIdRepair(text, verdict);
      if (next === null) {
        entry.skipped.push({ filename, id: null, reason: 'unrepairable-id' });
        continue;
      }
      outText = next;
    } else if (verdict.kind === 'not-derivable') {
      // A malformed stray file: park a COPY in the ROOT tier's quarantine (the
      // husk stays whole) so it is never silently dropped. Because this COPIES,
      // the same broken file is seen on every install — the bytes-identity
      // check is what stops it accumulating a fresh `.1.md`, `.2.md`, … each run.
      try {
        const bytes = readFileSync(from);
        const { dest, alreadyThere } = quarantineSlotFor(rootFactDir, filename, bytes);
        if (alreadyThere) {
          entry.skipped.push({ filename, id: null, reason: 'already-quarantined', to: dest });
          continue;
        }
        mkdirSync(join(dest, '..'), { recursive: true });
        writeFileSync(dest, bytes);
        entry.skipped.push({ filename, id: null, reason: 'quarantined', to: dest });
      } catch (err) {
        entry.errors.push(`recovery quarantine (${from}): ${err?.message ?? err}`);
      }
      continue;
    }

    if (existsSync(to)) {
      entry.skipped.push({ filename, id, reason: 'filename-exists' });
      continue;
    }
    if (id && ids.has(id)) {
      entry.skipped.push({ filename, id, reason: 'id-exists' });
      continue;
    }

    try {
      writeFileSync(to, outText, 'utf8');
    } catch (err) {
      entry.errors.push(`recovery write (${to}): ${err?.message ?? err}`);
      continue;
    }
    ids.add(id);
    entry.recovered.push({ filename, id, from, to });
    auditQuietly(rootTierRoot, {
      ts: nowIso(),
      action: 'stray-recovered',
      tier: stray.tier,
      id,
      reasonCode: REASON_CODES.STRAY_TIER_RECOVERED,
      paths: { before: from, after: to },
      extra: { strayTier: stray.tierRoot, repairedId: verdict.kind === 'repairable' },
    });
  }
  return entry;
}

/* ------------------------------------------------------------------ */
/* rendering                                                           */
/* ------------------------------------------------------------------ */

function pluralize(n, one, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Render the recovery report as install-output lines. Pure.
 *
 * SILENCE IS THE DEFAULT. Only what this RUN actioned is printed — so the second
 * install over the same husk says nothing at all (criterion 3: no repeated
 * noise). The husk that remains is HC-13's standing job, not install's.
 *
 * @param {object} report the `recoverMemory` result
 * @returns {string[]}
 */
export function formatRecoveryReport(report) {
  if (!report) return [];
  if (report.action === 'error') {
    return [
      `  note: memory recovery scan skipped (${report.errors[0] ?? 'unknown error'}) — install completed normally.`,
    ];
  }
  const lines = [];
  const actioned = (report.strays ?? []).filter((s) => s.recovered.length > 0);
  const totalFacts = actioned.reduce((n, s) => n + s.recovered.length, 0);

  if (actioned.length > 0) {
    lines.push(
      `  recovered ${pluralize(totalFacts, 'memory file')} from ${pluralize(actioned.length, 'stray tier')} ` +
        `left behind by an older version — ids and dates preserved exactly.`,
    );
    for (const s of actioned) {
      lines.push(`    from ${s.tierRoot}`);
      if (s.skipped.length > 0) {
        lines.push(`      skipped ${pluralize(s.skipped.length, 'file')} already present at the root tier (nothing overwritten)`);
      }
      const leftovers = [];
      if (s.nonFact.memoryBullets > 0) leftovers.push(pluralize(s.nonFact.memoryBullets, 'MEMORY.md bullet'));
      if (s.nonFact.sessionFiles > 0) leftovers.push(pluralize(s.nonFact.sessionFiles, 'session file'));
      if (s.nonFact.transcriptFiles > 0) leftovers.push(pluralize(s.nonFact.transcriptFiles, 'transcript file'));
      if (s.nonFact.queueFiles > 0) leftovers.push(pluralize(s.nonFact.queueFiles, 'queue file'));
      if (leftovers.length > 0) {
        lines.push(`      left in place for you to review: ${leftovers.join(', ')} (not auto-merged)`);
      }
      lines.push(`      the old folder is untouched — delete it when you're ready:`);
      lines.push(`        ${s.deleteHint}`);
    }
  }

  if ((report.repaired ?? []).length > 0) {
    lines.push(
      `  repaired ${pluralize(report.repaired.length, 'fact file')} with a missing or invalid id — now indexed and recallable.`,
    );
  }
  if ((report.quarantined ?? []).length > 0) {
    lines.push(
      `  quarantined ${pluralize(report.quarantined.length, 'unreadable fact file')} → memory/archive/${QUARANTINE_DIRNAME}/ ` +
        `(bytes preserved; nothing was deleted).`,
    );
  }
  // A partial failure on a COMPLETED run is still a failure, and it is exactly
  // the shape this repo's history says goes unnoticed: an unreadable candidate
  // is dropped from the scan, so both this report AND HC-13 go quiet about a
  // tier that may well hold real facts. One line, only when something actually
  // failed — it repeats until the cause is fixed, which is the point.
  if ((report.errors ?? []).length > 0) {
    lines.push(
      `  note: ${pluralize(report.errors.length, 'memory-recovery step')} could not complete — ${report.errors[0]}` +
        `${report.errors.length > 1 ? ` (+${report.errors.length - 1} more)` : ''}. Install itself completed normally.`,
    );
  }
  return lines;
}
