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
import { dirname, join, relative } from 'node:path';
import { canonicalize, generateId } from '@lh8ppl/cmk-canonicalize';
import { ID_PATTERN, resolveTierRoot, resolveFactDir } from './tier-paths.mjs';
import { listFactFiles, eachFactIn } from './fact-store.mjs';
import { parse } from './frontmatter.mjs';
import { stripBom } from './read-json.mjs';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import { removeDir } from './platform-commands.mjs';
import { reindex } from './reindex.mjs';

/**
 * BUDGET — the maximum number of INTERMEDIATE directories between the project
 * root and a stray tier the scan will find. FOUR, meaning `a/b/c/d/context` is
 * found and `a/b/c/d/e/context` is not.
 *
 * The unit is load-bearing and was wrong once: an earlier boundary made the
 * documented "4" actually find only 3 intermediate dirs, and nothing caught it
 * because only the OVER-cap side had a test. The at-cap case is now pinned in
 * both directions (design §17.10 budget-pair discipline, registered in
 * `validate-budget-pairs`).
 *
 * Why four:
 *   · A stray tier is created at the AGENT'S CWD, and the realistic deep cwd is
 *     a monorepo package or a folder inside it — `packages/cli` (2),
 *     `packages/cli/src` (3), `apps/web/src/features` (4). This repo's two real
 *     strays were at 1 and 2, so four is generous.
 *   · The cost is bounded by what it does NOT walk: `node_modules/` and every
 *     dot-directory, plus the usual build/vendor/template dirs, are pruned the
 *     moment they appear. A four-level walk over a pruned tree is a handful of
 *     readdir calls — which is what lets this run on EVERY install AND every
 *     `cmk doctor` (HC-13 shares the scan).
 *   · Anything deeper is simply not detectable by either surface, and the honest
 *     answer is that the bug class being recovered from cannot produce one.
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

// The managed-block opening marker the kit writes into every agent instruction
// file it owns. Its PRESENCE in a nested project's instruction file is proof
// that project ran `cmk install` for itself — see isNeighborProject.
const MANAGED_BLOCK_MARKER = 'core-memory-kit:start';

// Agent instruction files that can carry the kit's managed block, one per
// supported surface. A nested project installed for ANY agent counts.
const INSTRUCTION_FILES = [
  'CLAUDE.md',
  'AGENTS.md',
  join('.cursor', 'rules', 'core-memory-kit.mdc'),
  join('.kiro', 'steering', 'cmk.md'),
];

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

// "Populated" is answered from the STAT, never the contents (M3): a tier's
// `transcripts/` can hold tens of megabytes, and HC-13 re-runs this walk on
// every `cmk doctor`. Reading them to learn "non-empty" would make a liveness
// probe cost the size of the corpus. A file of only whitespace now counts as
// populated — an acceptable trade for a probe that is O(1) per file.
function fileHasContent(path) {
  try {
    const st = statSync(path);
    return st.isFile() && st.size > 0;
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
 * Is `dir` a project in its OWN right — a NEIGHBOR, not a stray (B2)?
 *
 * The scan's original discriminator answered "does this tier hold live state?"
 * and stopped there. But a nested REAL project — a second repo checked out
 * inside the first, or (the fat-finger case) `cmk install` run from a parent
 * folder that holds several installed repos — has a tier full of live state too.
 * Treating it as a stray copied its facts into the wrong project's memory AND
 * printed a delete hint for a LIVE tier. Recovering memory must never eat a
 * neighbour's.
 *
 * Two markers, either one decisive:
 *   · a `.git` entry (dir OR file — a worktree/submodule writes a `.git` FILE)
 *     — this directory is its own repository, so its `context/` travels with
 *     its own clone and cannot be an orphan of OURS;
 *   · an agent instruction file carrying the kit's `core-memory-kit:start`
 *     managed block — this directory ran `cmk install` for itself, which is the
 *     positive proof that its tier is deliberate.
 *
 * Deliberately NOT a liveness signal on the tier itself: a stray and a neighbour
 * look IDENTICAL from inside the tier. The evidence has to come from the parent.
 *
 * Shared by `recoverMemory` and doctor's HC-13 through `scanStrayTiers`, so a
 * neighbour is invisible to BOTH — it is not "a stray we decline to fix", it is
 * not a stray.
 */
export function isNeighborProject(dir) {
  try {
    if (existsSync(join(dir, '.git'))) return true;
    for (const rel of INSTRUCTION_FILES) {
      const p = join(dir, rel);
      if (!existsSync(p)) continue;
      try {
        if (readFileSync(p, 'utf8').includes(MANAGED_BLOCK_MARKER)) return true;
      } catch {
        // unreadable instruction file — not evidence either way
      }
    }
  } catch {
    // Fail SAFE, not fail-open: if we cannot tell, assume neighbour. The cost of
    // a false neighbour is one un-recovered stray the user can still see and
    // move by hand; the cost of a false stray is copying a live project's memory
    // into another project and telling the user to delete the original.
    return true;
  }
  return false;
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
    // `depth` = how many directories deep `dir` sits below the project root.
    // A tier found while listing `dir` therefore has exactly `depth`
    // intermediate directories between it and the root, which is the number
    // MAX_SCAN_DEPTH budgets.
    let hasTier = false;
    const descend = [];
    for (const entry of safeReaddir(dir)) {
      if (!entry.isDirectory()) continue; // symlinks report false — deliberately not followed
      const name = entry.name;
      const full = join(dir, name);
      const tier = TIER_BY_DIRNAME[name];
      if (tier) {
        // depth 0 is the project root itself: its `context/` IS the root tier.
        // Never a candidate, and never descended into.
        if (depth === 0) continue;
        hasTier = true;
        try {
          const described = describeTier(full, tier);
          if (described.live) strays.push(described);
        } catch (err) {
          errors.push(`stray scan: ${full}: ${err?.message ?? err}`);
        }
        continue;
      }
      if (name.startsWith('.') || PRUNED_DIRS.has(name)) continue;
      if (depth < maxDepth) descend.push(full);
    }
    // B2: a candidate's OWN directory decides whether its tier is a stray or a
    // neighbour's live memory. Checked once per directory, and only when that
    // directory actually held a tier — so the common case pays nothing.
    if (hasTier && isNeighborProject(dir)) {
      for (let i = strays.length - 1; i >= 0; i -= 1) {
        if (dirname(strays[i].tierRoot) === dir) strays.splice(i, 1);
      }
    }
    for (const child of descend) visit(child, depth + 1);
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

// Task 257 — ONE STRIP EVERYWHERE (the contract, not an optimization).
//
// This module used to carry its OWN copy of stripBom (a byte-for-byte re-roll of
// read-json.mjs's canonical helper — exactly the drift the shared-modules rule
// exists to stop) AND to call `parse(stripBom(text))`, which after Task 257 made
// classification a DOUBLE strip while every other reader in the kit gets ONE.
// That asymmetry was the worst of both worlds: a 2-BOM file classified `valid`,
// so recovery walked past it as healthy, while reindex/recall/INDEX/MAP still
// could not see it — invisible forever AND never flagged.
//
// So classification now uses the SAME parse contract as the rest of the kit: one
// leading BOM tolerated, no more. A file with >=2 BOMs is `not-derivable` →
// quarantined with its ORIGINAL bytes intact → named in the report. Visible and
// flagged beats invisible and silent, and the user keeps every byte either way.
//
// The strip in front of the TEXTUAL id splice below STAYS and is load-bearing:
// that path never goes through `parse`, and it is what drops the BOM from a file
// being rewritten anyway.

/**
 * Classify a fact file's id: already valid, repairable (content-addressed), or
 * not derivable. Pure — takes the file text, returns a verdict.
 *
 * Uses `parse` DIRECTLY — no extra stripBom. That is the one-strip-everywhere
 * contract (see the note above): classification must see exactly what the rest
 * of the kit sees, or it certifies as healthy a file nothing else can read.
 *
 * @param {string} text raw file contents
 * @param {'P'|'L'|'U'} tier
 */
export function classifyFactId(text, tier) {
  const { frontmatter, body, parseError } = parse(text);
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

// An `id:` key at the top level of the frontmatter block — the LINE, whatever
// its value (empty, `null`, numeric, quoted, a block-scalar header). Presence of
// this line is what decides INSERT vs SWAP; the parsed VALUE is not, because
// `id:` and `id: null` both parse to null while a line is very much there
// (the B1 duplicate-key corruption).
const ID_LINE_RE = /^id:[^\r\n]*$/m;

/**
 * Render `previousId` as a single-line, always-quoted YAML scalar.
 *
 * Two hazards, both from real shapes the reviewer reproduced:
 *   · a BLOCK SCALAR id (`id: |` + indented continuation lines) parses to a
 *     multi-line string; splicing it raw orphans its continuation lines into the
 *     mapping and breaks the document. Only the first line is kept.
 *   · types must round-trip as STRINGS: an unquoted `12345` would come back a
 *     number, and an unquoted `$&BAD` or `a: b` is not a scalar at all.
 * `JSON.stringify` gives a YAML-1.1-compatible double-quoted scalar with the
 * escaping already done.
 */
function asQuotedScalar(value) {
  const firstLine = String(value).split(/\r?\n/, 1)[0].trim();
  return JSON.stringify(firstLine);
}

/**
 * Write the derived id into the frontmatter, preserving EVERY other byte.
 *
 * A YAML round-trip (`format(parse(text))`) would re-quote and re-order
 * unrelated values, which is exactly what faithful-relocation forbids — so this
 * is a textual edit: an INSERT after the opening `---` when there is no `id:`
 * line at all, or a one-line SWAP (keeping the old value as `legacy_id`, so a
 * citation of the old id still greps to this file) when a line exists. CRLF is
 * preserved as found; a BOM is deliberately DROPPED (see below).
 *
 * **INSERT vs SWAP is decided by the LINE, not the parsed value** (B1). `id:`
 * with an empty value and `id: null` both parse to `null`, so keying off the
 * value inserted a SECOND `id:` line — a duplicate YAML key, which made the file
 * unparseable, and the next run then quarantined the mangled bytes. Corrupt,
 * then evict, on the most likely wild shape there is.
 *
 * **The BOM is stripped on write (I2).** Normally this function preserves every
 * byte it does not own — but `frontmatter.parse`'s `^---` anchor does not
 * tolerate a leading U+FEFF, so a BOM'd fact file is invisible to reindex,
 * recall and every fact walk. Repairing the id while leaving the BOM in place
 * would let the report claim "now indexed and recallable" for a file that still
 * is not. This pass legitimately owns a file it is already rewriting, so it
 * removes the one byte sequence that keeps the fix from being true.
 *
 * @returns {string|null} the repaired text, or null when the shape is not
 *   what we expected (caller quarantines the ORIGINAL rather than guessing).
 */
export function applyIdRepair(text, { id, previousId }) {
  const rest = stripBom(text);
  const m = rest.match(/^---(\r?\n)([\s\S]*?)(?=\r?\n---)/);
  if (!m) return null;
  const eol = m[1];
  const fmText = m[2];
  const head = `---${eol}`;
  let nextFm;
  if (!ID_LINE_RE.test(fmText)) {
    // No `id:` line anywhere — a clean insert at the top of the block.
    nextFm = `id: ${id}${eol}${fmText}`;
  } else {
    // A line exists (whatever its value): swap it, keeping the old value only
    // when there WAS one worth keeping. A replacer FUNCTION, never a string —
    // `$&` / `$1` inside a replacement string are substitution patterns, and a
    // real id containing `$&` mangled the output (I1).
    const legacy = previousId === null ? '' : `${eol}legacy_id: ${asQuotedScalar(previousId)}`;
    nextFm = fmText.replace(ID_LINE_RE, () => `id: ${id}${legacy}`);
  }
  return head + nextFm + rest.slice(head.length + fmText.length);
}

/**
 * THE UNIVERSAL REPAIR GUARD — the one door every id repair goes through.
 *
 * `applyIdRepair` is a textual edit against YAML it does not fully model, so
 * "the edit looked fine" is not evidence the FILE is fine. This verifies the
 * OUTPUT before a single byte is written: the repaired text must re-parse, must
 * carry exactly the id we derived, and must still hold the same body. Anything
 * else and the caller keeps the ORIGINAL bytes and routes through the normal
 * not-derivable → quarantine path — so a shape we mis-handle costs the user a
 * quarantined ORIGINAL they can recover from, never a mangled intermediate.
 *
 * Written as a guard rather than another special case on purpose: B1 was ONE
 * unhandled shape (`id:` with an empty value), and the next unhandled shape
 * would have shipped exactly the same corrupt-then-evict outcome. This closes
 * the class, not the instance.
 *
 * @returns {{ok: true, text: string} | {ok: false, reason: string}}
 */
export function repairFactText(text, verdict) {
  const next = applyIdRepair(text, verdict);
  if (next === null) {
    return { ok: false, reason: 'frontmatter shape not safely editable' };
  }
  const after = parse(next);
  if (!after.frontmatter || after.parseError) {
    return { ok: false, reason: `repair would not re-parse: ${after.parseError ?? 'no frontmatter'}` };
  }
  if (after.frontmatter.id !== verdict.id) {
    return {
      ok: false,
      reason: `repair did not yield the derived id (got ${JSON.stringify(after.frontmatter.id)})`,
    };
  }
  // The body is the FACT. A frontmatter-only edit that moved it is a bug in the
  // edit, and one this pass must never persist. `parse(text)` — not
  // `parse(stripBom(text))` — for the same one-strip-everywhere reason as
  // classifyFactId: the guard must compare against what the KIT reads. (A file
  // needing two strips never reaches here anyway; classification stops it.)
  if (after.body !== parse(text).body) {
    return { ok: false, reason: 'repair would have altered the fact body' };
  }
  return { ok: true, text: next };
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
    let verdict = classifyFactId(text, tier);
    if (verdict.kind === 'valid') continue;
    if (verdict.kind === 'repairable') {
      // The universal guard: verify the OUTPUT re-parses to the derived id with
      // the body intact BEFORE writing. A rejected repair demotes to
      // not-derivable, so the ORIGINAL bytes fall through to quarantine —
      // never a mangled intermediate (B1).
      const attempt = repairFactText(text, verdict);
      if (!attempt.ok) {
        verdict = { kind: 'not-derivable', reason: attempt.reason };
      } else {
        try {
          // Guarded: an unwritable file (read-only bit, an editor lock) must
          // cost only ITS repair, not the rest of the pass — this loop is the
          // last thing standing between a corrupt neighbour and every other
          // file's fix.
          writeFileSync(path, attempt.text, 'utf8');
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
function rootIdCensus(factDir, tierRoot) {
  const ids = new Set();
  for (const fact of eachFactIn(factDir)) ids.add(fact.id);
  for (const sub of ['tombstones', 'superseded', QUARANTINE_DIRNAME]) {
    for (const fact of eachFactIn(join(factDir, 'archive', sub))) ids.add(fact.id);
  }
  // M1 — the SECOND tombstone directory. `forget` on a per-fact file writes to
  // `<factDir>/archive/tombstones/` (handled above), but `forget` on a
  // SCRATCHPAD BULLET writes to `<tierRoot>/archive/tombstones/`
  // (memory-write.mjs) — a different path, one level up. Missing it meant a
  // bullet the user forgot could be resurrected as a fact file from a stray.
  if (tierRoot) {
    for (const fact of eachFactIn(join(tierRoot, 'archive', 'tombstones'))) ids.add(fact.id);
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
 * @param {string} [o.userDir]        the user tier. Its ID-REPAIR half runs (Task
 *                                    270 / D-445 — `cmk persona import` writes
 *                                    `fragments/` as raw bytes, bypassing writeFact's
 *                                    id boundary); its STRAY half does not, because
 *                                    the U tier has no project-relative fork path.
 *                                    Omitted → the U tier is skipped entirely.
 * @param {Function} [o._scanFn]      test seam
 * @param {Function} [o._reindexFn]   test seam
 * @returns {{action:'completed'|'error', strays:object[], repaired:object[],
 *            quarantined:object[], reindexed:string[], errors:string[]}}
 */
export function recoverMemory({ projectRoot, userDir, _scanFn, _reindexFn } = {}) {
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
    //
    // Task 270 (D-445): the U tier joined this loop. The STRAY half below stays
    // P/L — the user tier has no project-relative fork path, which is what the
    // old "U is not stray-prone" note actually meant — but the ID-REPAIR half
    // applies to any fact dir, and the user tier has a raw-write entry point
    // that nothing else guards: `cmk persona import` writes the whole bundle,
    // `fragments/` included, with plain `writeFileSync` (persona-portability.mjs
    // `applyBundleAtomic`), bypassing `writeFact` and therefore its id boundary.
    // A bundle exported from a pre-boundary corpus can carry an unusable id
    // ONTO A DIFFERENT MACHINE. Without this, HC-16 would flag such a fact and
    // prescribe `cmk install`, install would repair nothing, and doctor would
    // fail forever — the non-convergent loop HC-16's own contract refuses to
    // create.
    for (const tier of ['P', 'L', ...(userDir ? ['U'] : [])]) {
      const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
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
        doReindex({ tier, projectRoot, userDir, warn: () => {} });
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
    ids = rootIdCensus(rootFactDir, rootTierRoot);
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

    let verdict = classifyFactId(text, stray.tier);
    let outText = text;
    let id = verdict.id ?? null;
    if (verdict.kind === 'repairable') {
      // Same universal guard as the root pass (B1): a repair that would not
      // re-parse to the derived id is demoted to not-derivable, so the ORIGINAL
      // bytes go to quarantine instead of a mangled copy landing in the tier.
      const attempt = repairFactText(text, verdict);
      if (!attempt.ok) {
        verdict = { kind: 'not-derivable', reason: attempt.reason };
        id = null;
      } else {
        outText = attempt.text;
      }
    }
    if (verdict.kind === 'not-derivable') {
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
 * Render the recovery report as install-output lines.
 *
 * SILENCE IS THE DEFAULT. Only what this RUN actioned is printed — so the second
 * install over the same husk says nothing at all (criterion 3: no repeated
 * noise). The husk that remains is HC-13's standing job, not install's.
 *
 * TOTAL by contract (M2): the recovery itself is fail-open, and it would be an
 * absurd way to lose that property if a malformed report object let the RENDERER
 * throw — after the install already succeeded and the bytes already landed. Any
 * failure inside degrades to one honest line.
 *
 * @param {object} report the `recoverMemory` result
 * @returns {string[]}
 */
export function formatRecoveryReport(report) {
  try {
    return renderRecoveryLines(report);
  } catch (err) {
    return [`  note: the memory-recovery summary could not be rendered (${err?.message ?? err}) — install completed normally.`];
  }
}

function renderRecoveryLines(report) {
  if (!report) return [];
  if (report.action === 'error') {
    return [
      `  note: memory recovery scan skipped (${report.errors?.[0] ?? 'unknown error'}) — install completed normally.`,
    ];
  }
  const lines = [];
  const actioned = (report.strays ?? []).filter((s) => (s?.recovered?.length ?? 0) > 0);
  const totalFacts = actioned.reduce((n, s) => n + s.recovered.length, 0);

  if (actioned.length > 0) {
    lines.push(
      `  recovered ${pluralize(totalFacts, 'memory file')} from ${pluralize(actioned.length, 'stray tier')} ` +
        `left behind by an older version — ids and dates preserved exactly.`,
    );
    for (const s of actioned) {
      lines.push(`    from ${s.tierRoot}`);
      const skipped = s.skipped ?? [];
      if (skipped.length > 0) {
        lines.push(`      skipped ${pluralize(skipped.length, 'file')} already present at the root tier (nothing overwritten)`);
      }
      const nonFact = s.nonFact ?? {};
      const leftovers = [];
      if (nonFact.memoryBullets > 0) leftovers.push(pluralize(nonFact.memoryBullets, 'MEMORY.md bullet'));
      if (nonFact.sessionFiles > 0) leftovers.push(pluralize(nonFact.sessionFiles, 'session file'));
      if (nonFact.transcriptFiles > 0) leftovers.push(pluralize(nonFact.transcriptFiles, 'transcript file'));
      if (nonFact.queueFiles > 0) leftovers.push(pluralize(nonFact.queueFiles, 'queue file'));
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
