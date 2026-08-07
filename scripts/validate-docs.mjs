#!/usr/bin/env node
// validate-docs.mjs — the ONE manifest-driven documentation validator
// (Task 186, the D-249 structural graduation).
//
// Why one script
// --------------
//
// Doc-coverage used to be FOUR overlapping validators — validate-doc-registry
// (new-file registration), validate-references (link/ID rot),
// validate-index-completeness (catalog indexes), validate-doc-completeness
// (CLI/MCP verb+tool coverage + deferral honesty) — redundant where they
// overlapped, gap-ridden where none reached (the v0.4.3 stale-docs find).
// D-249 unified the JUDGMENT layer into one per-change walk over the
// source-of-truth table; THIS script unifies the STRUCTURAL layer: one
// entry, one manifest, four check FAMILIES. To add a doc there is ONE
// place: docs/DOCUMENTATION-MAP.md (the manifest).
//
// Original plan (pre-2026-07-20): four standalone scripts, each wired
// separately into `npm test` (see git history for their sources). Pivoted
// by Task 186: their logic lives on here as families with behavior
// preserved (the four scripts-validate-* test suites still pin each
// family through this entry).
//
// The manifest
// ------------
//
// docs/DOCUMENTATION-MAP.md is the single input:
//   - its Registry section lists every high-risk working doc (LIVING docs);
//   - bulk history dirs (docs/research, docs/sources, docs/process,
//     docs/adr, docs/conversation-log, archive) are RECORD zones —
//     registered by zone, never policed file-by-file, never flagged.
//
// The classification is explicit in ZONES below (living high-risk zones vs
// record zones); the file-level membership lives in the map.
//
// Families
// --------
//
//   registry    — every high-risk-zone .md is registered in the map
//                 (direction 1) AND every path-shaped Registry entry exists
//                 on disk (direction 2 — NEW in the consolidation; the old
//                 registry validator was one-directional).
//   references  — internal-reference rot: [label](path), [label](path#anchor),
//                 ADR-NNNN, §N.N (design.md), FR-N, NFR-N, Task N, D-nnn.
//   catalogs    — the hand-maintained catalog indexes (adr/README,
//                 research/INDEX, sources/README, process/README) list every
//                 sibling .md, both directions.
//   coverage    — every CLI verb has a CLI.md heading; every MCP tool +
//                 zod param appears in MCP.md; deferral phrases are
//                 allowlisted with reasons (both directions).
//
// What this does NOT do (honest scope boundary, per the task): judge
// content-STALENESS ("is this §N current for the change") — that stays the
// D-249 per-change walk's judgment. This script owns existence / link /
// registration / coverage only.
//
// Suppression
// -----------
//
// `<!-- validate-docs: ignore -->` on the same line as a reference
// suppresses it. The legacy `<!-- validate-references: ignore -->` marker
// (pre-consolidation) is honored forever — existing docs carry it.
//
// Run: `node scripts/validate-docs.mjs [--only <family>[,<family>...]]`
// Wired into `npm test` as a pre-test step. Honors CMK_VALIDATOR_ROOT for
// sandboxed self-tests (fixture roots should use --only to select the
// family under test; the coverage family needs the real repo's sources).

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const SCRIPT_REPO = resolve(dirname(__filename), '..');
const REPO = process.env.CMK_VALIDATOR_ROOT
  ? resolve(process.env.CMK_VALIDATOR_ROOT)
  : SCRIPT_REPO;

const MAP_REL = 'docs/DOCUMENTATION-MAP.md';
const SUPPRESSIONS = ['validate-docs: ignore', 'validate-references: ignore'];

/**
 * The living-vs-record classification (the map's zones, as data).
 *
 * `livingHighRisk` — where rogue state surfaces historically appeared; every
 * .md here must be registered in the map. `record` — bulk history dirs,
 * registered by zone, never policed file-by-file (a new research note or
 * ADR is expected history, not a new state surface). `record` dirs marked
 * refSkip are also excluded from the references scan (their internal refs
 * are third-party/frozen worlds — the PR-C audit's corpus boundary).
 */
export const ZONES = {
  livingHighRisk: [
    { dir: '.', recursive: false }, // repo-root *.md
    { dir: 'specs', recursive: true },
    { dir: 'docs', recursive: false },
    { dir: 'docs/journey', recursive: false },
  ],
  record: [
    { dir: 'docs/research', refSkip: true },
    { dir: 'docs/sources', refSkip: true },
    { dir: 'docs/conversation-log', refSkip: true },
    { dir: 'archive', refSkip: true },
    { dir: 'docs/adr', refSkip: false }, // records, but ref-scanned (live citations point in)
    { dir: 'docs/process', refSkip: false },
  ],
};

function relPosix(root, abs) {
  return relative(root, abs).split(sep).join('/');
}

function topLevelMd(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map((e) => join(dir, e.name));
}

// Directories never worth descending into. Pruned DURING the walk, not filtered
// after it: the counts family (Task 236) is the first caller to walk the repo
// ROOT rather than a known subdir, and post-hoc filtering still paid the full
// recursive readdir of node_modules — measured 9.19s vs 38ms, a >200x tax on
// every `npm test` and 5x that under stress (skill-review).
const WALK_SKIP_DIRS = new Set([
  'node_modules', '.git', '.stress-logs', '.test-logs', 'coverage', 'dist', '.vitest',
]);
// Agent worktrees are a WHOLE SECOND COPY of the repo at a different commit -
// scanning one produces stale-count findings for prose that is correct at its
// own commit, and a locked worktree made `npm test` unrunnable on the primary
// checkout (2026-08-08). Deliberately `.claude/worktrees`-narrow, NOT all of
// `.claude` - `.claude/skills/*.md` are legitimately in scope for count claims.
const WALK_SKIP_PATHS = new Set([join(REPO, '.claude', 'worktrees')]);

function walkMdRec(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && WALK_SKIP_DIRS.has(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (WALK_SKIP_PATHS.has(p)) continue;
      walkMdRec(p, out);
    } else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

// ====================================================================
// Family: registry
// ====================================================================

/**
 * Path-shaped .md tokens from the map's Registry section (from the
 * `## Registry` heading to EOF). Accepts backticked or bare tokens; a
 * token is path-shaped when it is a repo-root filename or a specs/ or
 * docs/-prefixed path ending in .md. Tokens in other zones (archive/…)
 * are provenance prose, not registry entries.
 *
 * @param {string} mapText full DOCUMENTATION-MAP.md source
 * @returns {string[]} unique path-shaped registry entries
 */
export function parseRegistryEntries(mapText) {
  const idx = mapText.search(/^## Registry\b/m);
  if (idx === -1) return [];
  const section = mapText.slice(idx);
  const out = new Set();
  // BACKTICKED tokens ONLY — a registry ENTRY is structural (`path/to/doc.md`),
  // never free prose.
  //
  // Skill-review B3: matching bare tokens too made direction-2 harvest paths out
  // of ORDINARY SENTENCES. On the real map it was already pulling three paths from
  // a prose line ("_Reclassified 2026-05-31 …_"), green only because those files
  // happen to exist — and it would FAIL the build the moment the map narrated an
  // archived or renamed doc ("the old plan lived in docs/journey/OLD-PLAN.md
  // before it was archived"). That is exactly what the decision-trail-preservation
  // rule REQUIRES the map to be able to say, so the check would have punished the
  // repo for following its own binding rule. A validator that fires on correct
  // prose is worse than none; restrict to the structural form.
  const re = /`((?:[A-Za-z0-9._-]+|(?:specs|docs)\/[A-Za-z0-9._/-]+)\.md)`/g;
  for (const m of section.matchAll(re)) out.add(m[1]);
  return [...out];
}

function familyRegistry() {
  const errors = [];
  const mapAbs = join(REPO, ...MAP_REL.split('/'));
  if (!existsSync(mapAbs)) {
    return {
      errors: [
        `${MAP_REL} is missing. The documentation registry is the single manifest of where every doc lives; create it before adding working docs.`,
      ],
      summary: 'registry: MAP MISSING',
    };
  }
  const mapText = readFileSync(mapAbs, 'utf8');

  // Direction 1 — every high-risk-zone file is registered somewhere in the map.
  const highRisk = [];
  for (const zone of ZONES.livingHighRisk) {
    const abs = zone.dir === '.' ? REPO : join(REPO, ...zone.dir.split('/'));
    highRisk.push(...(zone.recursive ? walkMdRec(abs) : topLevelMd(abs)));
  }
  const seen = new Set();
  for (const abs of highRisk) {
    const rel = relPosix(REPO, abs);
    if (seen.has(rel)) continue;
    seen.add(rel);
    if (!mapText.includes(rel)) {
      errors.push(
        `${rel} — unregistered doc surface (not listed in ${MAP_REL}). Register it in the Registry section in the same change — or, if this is a new kind of state surface, DON'T: route the content into requirements/design/tasks.`,
      );
    }
  }

  // Direction 2 (NEW) — every path-shaped Registry entry exists on disk.
  const entries = parseRegistryEntries(mapText);
  for (const rel of entries) {
    if (!existsSync(join(REPO, ...rel.split('/')))) {
      errors.push(
        `${MAP_REL}: registers '${rel}' which does not exist — a stale registry entry (file renamed/deleted). Remove or fix the entry.`,
      );
    }
  }

  return {
    errors,
    summary: `registry: ${seen.size} high-risk doc(s) all registered, ${entries.length} manifest entr${entries.length === 1 ? 'y' : 'ies'} live`,
  };
}

// ====================================================================
// Family: references
// ====================================================================

// The DECISION-LOG is a GLOB, not a file (Task 249 composition). Task 249
// splits the append-only histories at a version boundary
// (`DECISION-LOG-archive-pre-v0.5.md` beside the live log), and the archive is
// where the PRE-SPLIT anchors live. Reading one file would make every citation
// to a pre-split entry dangle the day 249 lands — the check would punish the
// repo for doing the archiving 249 exists to do. Same treatment for
// `specs/tasks*.md`, which 249 splits the same way.
const DECISION_LOG_DIR = 'docs/journey';
const DECISION_LOG_PREFIX = 'DECISION-LOG';
const TASKS_DIR = 'specs';
const TASKS_PREFIX = 'tasks';

/**
 * Repo-relative posix paths of `<dirRel>/<prefix>*.md`, sorted for a stable
 * scan order. Top-level only — an archive sits beside its live file.
 */
function globMd(dirRel, prefix) {
  const abs = join(REPO, ...dirRel.split('/'));
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.startsWith(prefix) && e.name.endsWith('.md'))
    .map((e) => `${dirRel}/${e.name}`)
    .sort();
}

/** Is this line a CommonMark fence toggle? Returns the match (for its length). */
function fenceToggle(line) {
  return line.match(/^\s*(`{3,})\s*\S*\s*$/);
}

/**
 * The `D-nnn` citation token — MIRRORED from the kit's own D-anchor parser,
 * `packages/cli/src/graph-index.mjs` (`ANCHOR_MATCHERS`, the `slashNodes`
 * expansion), shipped in the same release. Mirrored rather than imported:
 * that module pulls in fact-store / frontmatter / tier-paths to build a graph
 * table, and this validator is a zero-dependency lint step.
 *
 * ONE deliberate divergence from the source: the optional `[a-z]?` sub-letter
 * (`D-253a`, `D-203c`), which the log really uses as entry ids and CLAUDE.md
 * really cites. The slash-continuation half is exact: `D-270/271/277` is
 * THREE citations, and validating only the head silently exempted every tail
 * in the corpus (~60 of them).
 */
const D_TOKEN = String.raw`\bD-(\d+[a-z]?)((?:\/\d+[a-z]?)*)\b`;

/** Every id a `D_TOKEN` match names: the head plus each slash-continuation. */
function expandDToken(m) {
  const out = [m[1]];
  if (m[2]) for (const tail of m[2].split('/')) if (tail) out.push(tail);
  return out;
}

/**
 * Index the DECISION-LOG's D-entry ids (Task 247).
 *
 * `D-nnn` is the most-cited internal reference in the corpus and was the ONE
 * member of the class on the honour system — every other id the `references`
 * family knows (ADR-NNNN / FR-N / NFR-N / Task N / §N.N) resolves to a real
 * anchor. The target failure is the FORWARD reference: `D-406` cited in
 * tasks.md while the log stops at D-405 (it happened with D-382 during Task
 * 245, and again across the D-380..D-384 authoring hour).
 *
 * WHAT COUNTS AS AN ANCHOR — an id in an ENTRY LEAD, not anywhere in the body.
 * The log grew three lead shapes over 400 entries and all three are live:
 *   `## 2026-07-27 — D-405 · DECISION — …`   (current headings)
 *   `## 2026-07-20 — D-375: DECISION — …`    (older headings, colon separator)
 *   `- **⚙️ DECISION (2026-06-14) — D-150: …**`  (the bold list-item era)
 * so a lead is "a heading line, or the leading bold span of a list item".
 * Restricting to leads is what keeps the check's teeth: the log's bodies are
 * dense with citations (`_Relates D-285, D-198._`), and indexing those would
 * make every typo self-anchoring.
 *
 * ALL ids in a lead are indexed, not just the first — because both are real:
 * `- **✅ FIX + RESOLUTION of D-212 (2026-06-27) — D-213: …**` opens with a
 * CITATION and carries its own id second. Taking the first would lose D-213
 * (a genuine anchor).
 *
 * THE COST, stated with both numbers (they are different questions):
 *   - MECHANISM — how many leads can mint a false anchor: **110** structural
 *     vectors in the log today (84 leads carrying more than one id, plus 30
 *     INDENTED sub-bullets that are formatting rather than entry leads; 4
 *     are both). Every one is a place where a quoted number becomes an
 *     anchor. (A review of this change measured 92 — 77 + 15 — against the
 *     narrower `\bD-\d+\b` token; widening it for sub-letters + slash
 *     continuations in the same round moved the count. Re-measure after any
 *     token change; do not trust either figure as a constant.)
 *   - OUTCOME — how many false anchors that mechanism actually produces
 *     today: **ONE** (`D-552`, a typo inside D-270's lead), and it is cited
 *     by nothing, so it masks nothing.
 * The mechanism is broad; the realised cost is one. That trade is deliberate
 * and matches this script's standing conservatism rule: an extra anchor can
 * only MASK a citation, while a missing anchor FAILS THE BUILD on correct
 * prose. Recorded honestly so a future reader weighs the mechanism, not just
 * today's tally.
 *
 * Fenced blocks + inline-code spans are stripped, exactly as on the scan side
 * — a lead-shaped EXAMPLE inside a ``` block in the log must not mint an
 * anchor (the asymmetry would let a doc's illustration authorise a citation).
 *
 * @param {string} logText a DECISION-LOG source (one file; callers union)
 * @returns {Set<string>} the D-ids, as strings ('405', '1', '253a', …)
 */
export function parseDecisionIds(logText) {
  const ids = new Set();
  const re = new RegExp(D_TOKEN, 'g');
  let fenceLen = 0;
  for (const line of String(logText).split(/\r?\n/)) {
    const fence = fenceToggle(line);
    if (fence) {
      if (fenceLen === 0) fenceLen = fence[1].length;
      else if (fence[1].length >= fenceLen) fenceLen = 0;
      continue;
    }
    if (fenceLen > 0) continue;
    let lead = null;
    if (/^#{1,6}\s/.test(line)) lead = line;
    else lead = line.match(/^\s*[-*]\s+\*\*(.*?)\*\*/)?.[1] ?? null;
    if (lead === null) continue;
    for (const m of lead.replace(/`[^`]*`/g, '').matchAll(re)) {
      for (const id of expandDToken(m)) ids.add(id);
    }
  }
  return ids;
}

function slugify(headingText) {
  return headingText
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function familyReferences() {
  const errors = [];

  const SKIP = new Set([
    // Per-template seed files have their own internal-reference world.
    join(REPO, 'template'),
    join(REPO, '.claude'),
    join(REPO, 'node_modules'),
    join(REPO, '.git'),
    // Record zones flagged refSkip (frozen/third-party reference worlds).
    ...ZONES.record.filter((z) => z.refSkip).map((z) => join(REPO, ...z.dir.split('/'))),
    // Dogfood volatile buffers (Task 52 / D-108): conversation capture is
    // data, not corpus — a growing now.md broke the prerun mid-stress once.
    join(REPO, 'context', 'sessions'),
    join(REPO, 'context', 'transcripts'),
    join(REPO, 'context.local'),
  ]);

  const mdFiles = [];
  (function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (SKIP.has(path)) continue;
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.md')) mdFiles.push(path);
    }
  })(REPO);

  // ADR index.
  const adrDir = join(REPO, 'docs', 'adr');
  const adrFiles = new Set();
  if (existsSync(adrDir)) {
    for (const f of readdirSync(adrDir)) {
      const m = f.match(/^(\d{4})-/);
      if (m) adrFiles.add(m[1]);
    }
  }

  const readMdIfExists = (rel) => {
    const p = join(REPO, ...rel.split('/'));
    return existsSync(p) ? readFileSync(p, 'utf8') : '';
  };

  // FR / NFR / Task ID indexes. Any occurrence in the requirements corpus
  // counts as a definition — rot is "no occurrence anywhere". FR-13 and
  // FR-013 are DISTINCT keys deliberately (external specs use 3-digit IDs;
  // normalization would silently coerce them — see git history D1-MIN-E).
  const requirementsText =
    readMdIfExists('specs/requirements.md') +
    '\n' +
    readMdIfExists('specs/requirements-revisions-proposed.md');
  const indexIds = (text, prefix) => {
    const ids = new Set();
    for (const m of text.matchAll(new RegExp(`\\b${prefix}-(\\d+)\\b`, 'g'))) ids.add(m[1]);
    return ids;
  };
  const frIds = indexIds(requirementsText, 'FR');
  const nfrIds = indexIds(requirementsText, 'NFR');

  // Task ids come from the tasks GLOB (`specs/tasks*.md`) so Task 249's
  // completed-task split into `specs/tasks-archive.md` keeps pre-split
  // `Task N` citations resolving.
  const taskSources = globMd(TASKS_DIR, TASKS_PREFIX);
  const taskIds = new Set();
  for (const rel of taskSources) {
    for (const line of readMdIfExists(rel).split(/\r?\n/)) {
      const m = line.match(/^\s*(?:#{1,6}\s+|[-*]\s+\[.\]\s+|[-*]\s+)?(\d{1,3})[.) ]/);
      if (m) taskIds.add(m[1]);
    }
  }

  // D-nnn anchors (Task 247). ONE parse per log source, reused for every file.
  // Parsed per-FILE and unioned rather than concatenated: fence state must not
  // bleed across an archive boundary.
  // No source (or all empty) => the sub-check is SKIPPED rather than turning
  // one missing FILE into N citation errors (fixture/sandbox roots have no
  // log). Deleting the real log is caught by the registry family's direction
  // 2 — DECISION-LOG.md is a backticked manifest entry in DOCUMENTATION-MAP.md.
  const decisionSources = globMd(DECISION_LOG_DIR, DECISION_LOG_PREFIX);
  let decisionIds = null;
  for (const rel of decisionSources) {
    const text = readMdIfExists(rel);
    if (text === '') continue;
    if (decisionIds === null) decisionIds = new Set();
    for (const id of parseDecisionIds(text)) decisionIds.add(id);
  }

  // Design-section anchors (§N.N).
  const designText = readMdIfExists('specs/design.md');
  const designSections = new Set();
  for (const m of designText.matchAll(/^\s*#{2,6}\s+(\d+(?:\.\d+){0,3})[.\s]/gm)) {
    designSections.add(m[1]);
  }

  // Heading-slug index per file (for [label](file#anchor)).
  const slugIndex = new Map();
  for (const path of mdFiles) {
    const slugs = new Set();
    try {
      const text = readFileSync(path, 'utf8');
      for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) slugs.add(slugify(m[1]));
    } catch {
      /* unreadable; reported when referenced */
    }
    slugIndex.set(path, slugs);
  }

  const record = (file, lineNumber, message) => {
    errors.push(`${relPosix(REPO, file)}:${lineNumber}: ${message}`);
  };
  const isHttpUrl = (s) => /^(?:https?:)?\/\//i.test(s) || s.startsWith('mailto:');

  const FILE_LINK_RE = /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const ADR_RE = /\bADR-(\d{4})\b/g;
  const DESIGN_SECTION_RE = /§(\d+(?:\.\d+){0,3})/g;
  const FR_RE = /\bFR-(\d+)\b/g;
  const NFR_RE = /\bNFR-(\d+)\b/g;
  const TASK_RE = /\bTask\s+(\d+)(?:[.)\s]|$)/g;
  const DNNN_RE = new RegExp(D_TOKEN, 'g');

  for (const file of mdFiles) {
    let text;
    try {
      text = readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const fileDir = dirname(file);
    // Frozen RECORDS are exempt from the D-nnn check (they are not exempt from
    // link/ADR rot — a broken path is broken whenever it was written). A
    // research note or an old build-log entry citing a since-superseded or
    // never-numbered D-entry is HISTORY, and "fixing" it is the bug the
    // frozen-record rule exists to prevent. This reuses the counts family's
    // path-prefix list verbatim, which also settles the DECISION-LOG itself:
    // it is the ANCHOR AUTHORITY, never a citation source policed against its
    // own anchors. Trade-off, stated rather than left silent (the same one
    // `counts` already accepts for docs/journey/): a typo in a BRAND-NEW log
    // or build-log entry goes unchecked.
    const frozen = isFrozenRecord(relPosix(REPO, file));
    const checkDnnn = decisionIds !== null && !frozen;
    // The SAME reasoning, applied to every other identifier family (D-418).
    // Found by running the suite for real: the kit's own auto-extract captured
    // a conversational proposal ("file this as Task 260") into a fact file, and
    // this family failed the build because Task 260 did not exist yet. That is
    // a category error — a memory fact records what was SAID at a moment, so a
    // forward reference in it is accurate history, not drift, exactly like the
    // "v0.3.5 verified all 9 health checks" case that put `context/` on the
    // frozen list in the first place. `D-nnn` already honored that; Task/FR/
    // NFR/ADR did not, which made the exemption half-applied and the memory
    // tier a source of build failures nobody could fix without editing memory
    // (which the kit forbids). FILE LINKS stay checked everywhere — a moved
    // file is real drift in any document.
    const checkIds = !frozen;
    const lines = text.split(/\r?\n/);

    // Fence tracking with fence-length semantics (CommonMark: an opening
    // fence of N backticks closes only on a same-char fence of length >= N,
    // so ``` examples nest inside ```` blocks without toggling state).
    let fenceLen = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const fenceMatch = fenceToggle(line);
      if (fenceMatch) {
        const len = fenceMatch[1].length;
        if (fenceLen === 0) fenceLen = len;
        else if (len >= fenceLen) fenceLen = 0;
        continue;
      }
      if (fenceLen > 0) continue;
      if (SUPPRESSIONS.some((s) => line.includes(s))) continue;
      const lineNumber = i + 1;
      // Inline-code spans are illustrative — strip before scanning.
      const scanLine = line.replace(/`[^`]*`/g, '');

      FILE_LINK_RE.lastIndex = 0;
      let m;
      while ((m = FILE_LINK_RE.exec(scanLine)) !== null) {
        const target = m[2];
        if (isHttpUrl(target)) continue;
        const [pathPart, anchor] = target.split('#');
        if (pathPart === '') {
          if (anchor && !slugIndex.get(file)?.has(slugify(decodeURIComponent(anchor)))) {
            record(file, lineNumber, `intra-file anchor "${anchor}" not found in this document`);
          }
          continue;
        }
        const resolved = resolve(fileDir, pathPart.split('/').join(sep));
        if (!existsSync(resolved)) {
          record(
            file,
            lineNumber,
            `broken link target: ${target} (resolved to ${relPosix(REPO, resolved)})`,
          );
          continue;
        }
        if (anchor && resolved.endsWith('.md')) {
          const slugs = slugIndex.get(resolved);
          if (slugs) {
            if (!slugs.has(slugify(decodeURIComponent(anchor)))) {
              record(file, lineNumber, `anchor "${anchor}" not found in ${relPosix(REPO, resolved)}`);
            }
          } else if (process.env.CMK_REFS_DEBUG === '1') {
            // Out-of-corpus .md target — anchor un-checked; quiet by default.
            console.error(
              `validate-docs: DEBUG anchor "${anchor}" on out-of-corpus target ${relPosix(REPO, resolved)} (skipped) — referenced from ${relPosix(REPO, file)}:${lineNumber}`,
            );
          }
        }
      }

      ADR_RE.lastIndex = 0;
      while (checkIds && (m = ADR_RE.exec(scanLine)) !== null) {
        if (!adrFiles.has(m[1])) {
          record(file, lineNumber, `ADR-${m[1]} has no file under docs/adr/`);
        }
      }

      // §N.N is only enforced inside design.md itself (elsewhere the
      // convention is `design §N.N` prose we can't parse reliably).
      if (file === join(REPO, 'specs', 'design.md')) {
        DESIGN_SECTION_RE.lastIndex = 0;
        while ((m = DESIGN_SECTION_RE.exec(scanLine)) !== null) {
          if (!designSections.has(m[1])) {
            record(file, lineNumber, `§${m[1]} has no matching heading in design.md`);
          }
        }
      }

      FR_RE.lastIndex = 0;
      while (checkIds && (m = FR_RE.exec(scanLine)) !== null) {
        if (!frIds.has(m[1])) {
          record(file, lineNumber, `FR-${m[1]} not defined in requirements.md or requirements-revisions-proposed.md`);
        }
      }

      NFR_RE.lastIndex = 0;
      while (checkIds && (m = NFR_RE.exec(scanLine)) !== null) {
        if (!nfrIds.has(m[1])) {
          record(file, lineNumber, `NFR-${m[1]} not defined in requirements.md or requirements-revisions-proposed.md`);
        }
      }

      TASK_RE.lastIndex = 0;
      while (checkIds && (m = TASK_RE.exec(scanLine)) !== null) {
        if (!taskIds.has(m[1])) {
          record(file, lineNumber, `Task ${m[1]} not defined in tasks.md`);
        }
      }

      if (checkDnnn) {
        DNNN_RE.lastIndex = 0;
        while ((m = DNNN_RE.exec(scanLine)) !== null) {
          // A slash continuation (`D-270/271/277`) is THREE citations, not one
          // — validate every id the token names, not just its head.
          for (const id of expandDToken(m)) {
            if (decisionIds.has(id)) continue;
            record(
              file,
              lineNumber,
              `D-${id} has no entry in ${DECISION_LOG_DIR}/${DECISION_LOG_PREFIX}*.md — a dangling ` +
                `decision citation (a forward reference to an unwritten entry, a typo'd number, or ` +
                `the entry's lead shape isn't recognised — design §17.13). Write/backfill the entry, ` +
                `fix the number, or mark the line <!-- validate-docs: ignore --> with a reason.`,
            );
          }
        }
      }
    }
  }

  // Report the skip explicitly rather than as "0 indexed" — a validator that
  // did not run a check must not read like a check that found nothing.
  const dPart =
    decisionIds === null
      ? `D-nnn SKIPPED (no ${DECISION_LOG_DIR}/${DECISION_LOG_PREFIX}*.md)`
      : `${decisionIds.size} D-entr${decisionIds.size === 1 ? 'y' : 'ies'} indexed ` +
        `from ${decisionSources.length} source${decisionSources.length === 1 ? '' : 's'}`;
  return {
    errors,
    summary:
      `references: ${mdFiles.length} markdown files scanned (${adrFiles.size} ADR / ${frIds.size} FR / ` +
      `${nfrIds.size} NFR / ${taskIds.size} Task IDs indexed; ${dPart})`,
  };
}

// ====================================================================
// Family: catalogs
// ====================================================================

/**
 * The catalog docs to police. Each: the dir (repo-relative posix), the index
 * file within it, and any siblings deliberately NOT indexed (allowlist).
 * The index file itself is auto-excluded — an index need not link itself.
 */
export const CATALOG_INDEXES = [
  { dir: 'docs/adr', indexFile: 'README.md', exclude: [] },
  { dir: 'docs/research', indexFile: 'INDEX.md', exclude: [] },
  { dir: 'docs/sources', indexFile: 'README.md', exclude: [] },
  { dir: 'docs/process', indexFile: 'README.md', exclude: [] },
];

/**
 * Extract same-directory `.md` link targets from a markdown body. Inline links
 * `[text](target.md)` only; skips external URLs, anchors, and paths that
 * escape the directory. Drops `#anchor` / `?query` suffixes.
 *
 * @param {string} md the markdown source
 * @returns {string[]} unique same-dir `.md` targets
 */
export function extractLinkedFiles(md) {
  const out = new Set();
  const re = /\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(md)) !== null) {
    let target = m[1].trim();
    target = target.replace(/\s+["'].*$/, '');
    target = target.replace(/[#?].*$/, '');
    if (target === '') continue;
    if (/^[a-z][a-z0-9+.-]*:/i.test(target)) continue;
    if (target.startsWith('#')) continue;
    if (target.includes('/')) continue;
    if (!target.toLowerCase().endsWith('.md')) continue;
    out.add(target);
  }
  return [...out];
}

/** Real `.md` filenames directly under cfg.dir (non-recursive — siblings only). */
export function listSiblingMarkdown(cfg) {
  const abs = join(REPO, ...cfg.dir.split('/'));
  return readdirSync(abs, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
    .map((e) => e.name)
    .sort();
}

/**
 * Pure check. Every sibling .md (minus the index file + allowlisted
 * exclusions) must appear in `linked`; every `linked` entry must exist.
 *
 * @param {object} a
 * @param {string}   a.dir        repo-relative dir (for messages)
 * @param {string}   [a.indexFile] the index filename, auto-excluded
 * @param {string[]} a.linked     `.md` targets the index links
 * @param {string[]} a.siblings   real `.md` filenames in the dir
 * @param {string[]} [a.exclude]  siblings deliberately not indexed
 * @returns {string[]} human-readable errors ([] = OK)
 */
export function checkIndexCompleteness({ dir, indexFile, linked, siblings, exclude = [] }) {
  const errors = [];
  const excludeSet = new Set([...(exclude ?? []), ...(indexFile ? [indexFile] : [])]);
  const linkedSet = new Set(linked);
  const siblingSet = new Set(siblings);

  for (const file of siblings) {
    if (excludeSet.has(file)) continue;
    if (!linkedSet.has(file)) {
      errors.push(
        `${dir}/${indexFile ?? 'index'}: sibling '${file}' is not listed — the index has drifted behind the directory. ` +
          `Add a link to it, or add it to the validator's exclude list if it is deliberately uncatalogued.`,
      );
    }
  }
  for (const file of linked) {
    if (excludeSet.has(file)) continue;
    if (!siblingSet.has(file)) {
      errors.push(
        `${dir}/${indexFile ?? 'index'}: links '${file}' which does not exist — a stale entry (file renamed/deleted). ` +
          `Remove or fix the link.`,
      );
    }
  }
  return errors;
}

function familyCatalogs() {
  const errors = [];
  let totalChecked = 0;
  for (const cfg of CATALOG_INDEXES) {
    const indexPath = join(REPO, ...cfg.dir.split('/'), cfg.indexFile);
    if (!existsSync(indexPath)) {
      errors.push(`${cfg.dir}/${cfg.indexFile}: index file not found`);
      continue;
    }
    const linked = extractLinkedFiles(readFileSync(indexPath, 'utf8'));
    const siblings = listSiblingMarkdown(cfg);
    totalChecked += siblings.length;
    errors.push(
      ...checkIndexCompleteness({
        dir: cfg.dir,
        indexFile: cfg.indexFile,
        linked,
        siblings,
        exclude: cfg.exclude,
      }),
    );
  }
  return {
    errors,
    summary: `catalogs: ${CATALOG_INDEXES.length} catalog index(es), ${totalChecked} sibling file(s) all listed`,
  };
}

// ====================================================================
// Family: coverage (CLI.md / MCP.md / deferral honesty)
// ====================================================================

// Commands that deliberately have no CLI.md section, each with a reason.
export const CLI_DOC_EXEMPT = new Map([
  ['help', 'commander built-in (auto-generated help text)'],
  ['version', 'trivial — `cmk --version` is shown in the quickstart'],
]);

// Legitimate deferral phrases — each entry pins ONE documented stub.
// Shipping the feature means deleting both the phrase and its entry here.
// Decision trail (preserved from the pre-consolidation script per the
// decision-trail-preservation rule — skill-review M7 caught its loss):
//   - `config` shipped real in Task 129 (D-121) — its stub deferral entry removed.
//   - `purge` shipped real in Task 96 (ADR-0022, D-346) — its entry removed.
export const DEFERRAL_ALLOWLIST = [];

const DEFERRAL_PATTERN = /not yet (shipped|implemented)|deferred to a later release/i;
const USER_FACING_DOCS = ['README.md', 'packages/cli/README.md', 'docs/CLI.md', 'docs/MCP.md'];

// Full regex-escape (CodeQL js/incomplete-sanitization).
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\-]/g, '\\$&');

/** Check — every CLI verb has a CLI.md heading mention. Pure. */
export function checkCliDocs({ cliVerbs, cliDocText, exempt = CLI_DOC_EXEMPT }) {
  const errors = [];
  const headings = cliDocText
    .split('\n')
    .filter((l) => l.startsWith('### '))
    .join('\n');
  for (const verb of cliVerbs) {
    if (exempt.has(verb)) continue;
    // The verb must appear DIRECTLY after `cmk ` in some heading — a loose
    // contains-match would false-pass 'get' via '### cmk config get'.
    const re = new RegExp(`cmk ${escapeRegExp(verb)}\\b`);
    if (!re.test(headings)) {
      errors.push(
        `CLI.md: command 'cmk ${verb}' has no \`### \` section heading — document it (or add it to CLI_DOC_EXEMPT with a reason)`,
      );
    }
  }
  return errors;
}

/** Check — every MCP tool + every schema param appears in MCP.md. Pure. */
export function checkMcpDocs({ toolParams, mcpDocText }) {
  const errors = [];
  for (const [tool, params] of toolParams) {
    if (!mcpDocText.includes(tool)) {
      errors.push(`MCP.md: tool '${tool}' is not documented`);
      continue;
    }
    for (const param of params) {
      if (!new RegExp(`\\b${param}\\b`).test(mcpDocText)) {
        errors.push(`MCP.md: tool '${tool}' parameter '${param}' is not documented`);
      }
    }
  }
  return errors;
}

/** Check — deferral phrases require an allowlist entry, both directions. Pure. */
export function checkDeferralPhrases({ docs, allowlist = DEFERRAL_ALLOWLIST }) {
  const errors = [];
  const used = new Set();
  for (const { path, text } of docs) {
    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (!DEFERRAL_PATTERN.test(lines[i])) continue;
      const hit = allowlist.findIndex(
        (a) => a.file === path && lines[i].includes(a.mustContain),
      );
      if (hit === -1) {
        errors.push(
          `${path}:${i + 1}: deferral phrase without an allowlist entry — either the feature shipped (delete the phrase) or it's a legitimate stub (add a DEFERRAL_ALLOWLIST entry with a reason): ${lines[i].trim().slice(0, 100)}`,
        );
      } else {
        used.add(hit);
      }
    }
  }
  allowlist.forEach((a, i) => {
    if (!used.has(i)) {
      errors.push(
        `DEFERRAL_ALLOWLIST entry ${i} ('${a.mustContain}' in ${a.file}) matched nothing — the stub shipped or the wording moved; remove/update the entry`,
      );
    }
  });
  return errors;
}

/** Parse tool → Set(param names) from mcp-server.mjs source. */
export function parseMcpToolParams(src) {
  const out = new Map();
  const segments = src.split(/registerTool\(\s*['"]/).slice(1);
  for (const seg of segments) {
    const tool = seg.match(/^([a-z_]+)['"]/)?.[1];
    if (!tool) continue;
    const schemaStart = seg.indexOf('inputSchema:');
    if (schemaStart === -1) {
      out.set(tool, new Set());
      continue;
    }
    // Bounded to the segment so the NEXT tool's keys can't bleed in.
    const block = seg.slice(schemaStart, seg.indexOf('},', schemaStart) + 1);
    out.set(tool, new Set([...block.matchAll(/\b([a-z_]+):\s*z\./g)].map((m) => m[1])));
  }
  return out;
}

async function familyCoverage() {
  // The verb list + tool schemas come from the kit's SOURCES (the script's
  // own repo); the docs come from REPO (root-overridable). In practice both
  // are the real repo — fixture tests select other families via --only.
  // Skill-review I4: under a fixture CMK_VALIDATOR_ROOT these reads threw a raw
  // ENOENT stack trace instead of a diagnostic. The header said fixture roots
  // "should use --only", which is prose, not enforcement. Fail with a real error.
  const missing = [];
  const readDoc = (rel) => {
    const abs = join(REPO, ...rel.split('/'));
    if (!existsSync(abs)) {
      missing.push(rel);
      return '';
    }
    return readFileSync(abs, 'utf8');
  };

  const { subcommands } = await import(
    pathToFileURL(join(SCRIPT_REPO, 'packages', 'cli', 'src', 'subcommands.mjs')).href
  );
  const cliVerbs = new Set(subcommands.map((s) => s.name));
  const cliDocText = readDoc('docs/CLI.md');
  const mcpDocText = readDoc('docs/MCP.md');
  const toolParams = parseMcpToolParams(
    readFileSync(join(SCRIPT_REPO, 'packages', 'cli', 'src', 'mcp-server.mjs'), 'utf8'),
  );
  const docs = USER_FACING_DOCS.map((p) => ({ path: p, text: readDoc(p) }));

  if (missing.length > 0) {
    return {
      errors: [
        `coverage: missing user-facing doc(s) under ${REPO}: ${missing.join(', ')} — ` +
          `the coverage family needs the real repo's docs (a sandboxed CMK_VALIDATOR_ROOT should select other families with \`--only\`)`,
      ],
      summary: 'coverage: SKIPPED (docs not found)',
    };
  }

  const errors = [
    ...checkCliDocs({ cliVerbs, cliDocText }),
    ...checkMcpDocs({ toolParams, mcpDocText }),
    ...checkDeferralPhrases({ docs }),
  ];
  const paramCount = [...toolParams.values()].reduce((n, s) => n + s.size, 0);
  return {
    errors,
    summary: `coverage: ${cliVerbs.size} CLI verbs documented, ${toolParams.size} MCP tools / ${paramCount} params documented, deferral phrases accounted`,
  };
}

// ====================================================================
// FAMILY: counts (Task 236 / D-364) — prose count-claims vs the live registry
// ====================================================================
//
// The drift class: sentences like "12 MCP tools" / "41 CLI verbs" are
// hand-maintained numbers about collections the CODE owns. We have hand-fixed
// them ~6 times across v0.4–v0.6, always after a human noticed.
//
// WHY A GENERIC SCAN, NOT A LIST OF LOCATIONS (the D-375 prior-art finding):
// ECC ships this exact gate and hand-enumerates 40 doc locations, each with its
// own file + regex. Their `WORKING-CONTEXT.md` is in NONE of them — which is
// exactly the file measured 4 months stale (claiming 47/79/181 while their tree
// held 67/94/278). Their gate runs green in CI and the staleness ships anyway:
// it checked 40 places, the drift happened in the 41st. Drift lands wherever you
// did not enumerate. So we scan every living doc, and a NEW doc is covered the
// day it is written rather than the day someone remembers to register it.

/**
 * The kit-owned collections whose size appears in prose. `nouns` are the
 * phrases a sentence uses for the collection; `resolve` reads the LIVE count
 * from the code (never a second hand-maintained number).
 */
// `nouns` are PLURAL forms ONLY — singulars are deliberately NOT matched.
// Skill-review found bare singulars firing on ordinary attributive prose ("6 MCP
// tool descriptions", "1 MCP tool automatically on install"): nothing stops the
// noun from modifying a following word. Restricting singulars to a count of one
// still could not separate "auto-register 1 MCP tool automatically" (incidental)
// from "ships 1 agent profile" (a real claim) — no cheap rule distinguishes
// them, so this family's conservatism rule decides it: a false positive fails
// the build on CORRECT prose, which is worse than missing a claim. Claims of
// exactly one are rare and low-value here anyway — drift makes a number grow,
// and anything past one takes the plural.
export const COUNT_COLLECTIONS = Object.freeze({
  mcpTools: { nouns: ['MCP tools', 'mk_ tools'], label: 'MCP tools' },
  cliVerbs: { nouns: ['CLI verbs', 'cmk verbs', 'subcommands'], label: 'CLI verbs' },
  healthChecks: { nouns: ['health checks', 'HC checks'], label: 'health checks' },
  agentProfiles: { nouns: ['agent profiles'], label: 'agent profiles' },
});

// Spelled-out numbers seen in real kit prose ("Twelve tools"). Bounded on
// purpose — beyond twenty, prose uses digits.
const NUMBER_WORDS = Object.freeze({
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
});

// Point-in-time RECORDS: these legitimately name historical counts, and
// "updating" one to match today's code is a bug, not a fix (the D-249
// frozen-record rule). Path-prefix matched, so a new research note or ADR is
// exempt automatically.
const FROZEN_RECORD_PREFIXES = [
  'CHANGELOG.md',
  'docs/adr/',
  'docs/research/',
  'docs/sources/',
  // ALL of docs/journey/, including the "living" build-log.md + DECISION-LOG.md.
  // This DIVERGES from CLAUDE.md's frozen-record bullet ("docs/journey/ except
  // the live build-log.md/DECISION-LOG.md") and the divergence is deliberate, so
  // it is stated rather than left as a silent contradiction (skill-review):
  // both files are APPEND-ONLY chronological records — every entry is dated and
  // true-as-of-writing, so a count inside one is history the moment it lands
  // (DECISION-LOG alone carries 11 such counts: "9 health checks", "33 CLI
  // verbs", …). They are "living" in that new entries are appended, NOT in that
  // old entries are revised — which is precisely the frozen-record property this
  // family cares about. Trade-off accepted: a wrong count in a BRAND-NEW entry
  // also goes unchecked.
  'docs/journey/',
  'docs/conversation-log/',
  'archive/',
  // NOT all of docs/process/ — skill-review caught this exemption doing exactly
  // what this family exists to prevent. CLAUDE.md's frozen-record rule scopes
  // the exemption to "the dated `docs/process/v0.*.*-self-test-*` guides"; the
  // cut-gate checklists beside them are LIVE (re-run every cut, `cut-gate-kiro.md`
  // last touched 2026-07-15) — and blanket-exempting the directory was hiding a
  // real drift in one: it still said "11 MCP tools" / "11 checks now" when both
  // are 12. The ECC "checked 40 places, drift happened in the 41st" failure,
  // reproduced inside the fix for it. Only the dated point-in-time guides are
  // frozen; see FROZEN_RECORD_PATTERNS below.
  // The MEMORY TIERS. Found by running this family for real (2026-07-20): the
  // kit's own captured memory is a point-in-time record in the strongest sense
  // — a fact reading "v0.3.5 verified all 9 health checks pass" is CORRECTLY
  // recorded history, and "fixing" it to match today's code would corrupt the
  // very thing the kit exists to keep. Same reasoning as docs/research, higher
  // stakes. (This is also where 50 of the family's first 62 hits came from.)
  'context/',
  'context.local/',
  // The completed-task ARCHIVE (Task 249). `specs/` is NOT a record prefix —
  // requirements/design/tasks are the live Spine — so the archive needs its own
  // entry, and it is a real one: its entries are the shipped-task retrospectives
  // verbatim, dense with counts that were true on their ship date ("HC-1..HC-9",
  // "6 tools"). Its SOURCE, `specs/tasks.md`, stays checked; only the frozen
  // half is exempt. Named individually rather than by a `specs/*-archive.md`
  // glob so a future `specs/` archive is a deliberate addition, not an
  // accidental exemption.
  'specs/tasks-archive.md',
  // The EXTERNAL-projects catalog. Also found by running this for real: every
  // count in SOURCES.md is about somebody ELSE's collection ("14 MCP tools" =
  // that project's tools, not ours). The collection nouns are not kit-exclusive,
  // so a doc whose whole subject is other projects can only produce noise here.
  'docs/SOURCES.md',
];

// Frozen by NAME rather than directory — the dated point-in-time guides that
// live alongside actively-maintained process docs (CLAUDE.md names this exact
// set: "the dated `docs/process/v0.*.*-self-test-*` guides").
const FROZEN_RECORD_PATTERNS = [
  /^docs\/process\/v\d+\.\d+\.\d+-/,
  // A memory tier at ANY depth, not just the repo root — `packages/cli/context/`
  // is the packaged scaffold's own tier and is just as much a point-in-time
  // record. The root-anchored `context/` prefix missed it.
  /(^|\/)context(\.local)?\//,
];

export function isFrozenRecord(path) {
  const p = String(path).replace(/\\/g, '/');
  if (FROZEN_RECORD_PREFIXES.some((pre) => p === pre || p.startsWith(pre))) return true;
  return FROZEN_RECORD_PATTERNS.some((re) => re.test(p));
}

/**
 * Find count-shaped claims about kit-owned collections. Pure.
 *
 * Deliberately CONSERVATIVE — a false positive here fails the build on correct
 * prose, which is worse than missing one claim. So the number must sit
 * immediately before the collection noun (optionally with one adjective
 * between), and a version-looking token (`v0.6.0`, `0.6`) never counts.
 *
 * @param {string} text
 * @returns {Array<{n: number, collection: string, line: number, raw: string}>}
 */
export function extractCountClaims(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/);
  const wordAlt = Object.keys(NUMBER_WORDS).join('|');

  for (const [collection, cfg] of Object.entries(COUNT_COLLECTIONS)) {
    for (const noun of cfg.nouns) {
      const num = String.raw`\d{1,4}|${wordAlt}`;
      // (number)(optional adjective, hyphenated allowed)(noun). Backticks around
      // the claim are tolerated — "`12 MCP tools`" is the same claim. `\b` on
      // both ends; a preceding `v` or `.` disqualifies the number as a version.
      const re = new RegExp(
        String.raw`(^|[^\w.])\`?(?:v)?(${num})\s+(?:[a-z][a-z-]*\s+)?${escapeRegExp(noun)}\b`,
        'gi',
      );
      for (let i = 0; i < lines.length; i += 1) {
        for (const m of lines[i].matchAll(re)) {
          // A `v` prefix or a dotted neighbour means a version, not a count.
          if (/^v/i.test(m[0].trim()) || /\d\.\d/.test(m[0])) continue;
          // IDENTIFIER, not a count. Found by running this for real: the corpus
          // is full of "Task 108 added MCP tools" and "#5873 for MCP tools",
          // which read as claims of 108 and 5873 tools. A number introduced by
          // `#` or by an identifier word is a name, not a quantity.
          const before = lines[i].slice(0, m.index + m[1].length);
          if (/(?:#|\b(?:task|issue|pr|adr|fr|nfr|hc|d)[-\s#]*)$/i.test(before)) continue;
          const token = m[2].toLowerCase();
          const n = NUMBER_WORDS[token] ?? Number(token);
          if (!Number.isFinite(n)) continue;
          out.push({ n, collection, line: i + 1, raw: m[0].trim() });
        }
      }
    }
  }
  return out;
}

// The range rule is skipped in the two living docs that narrate BUILD HISTORY
// inline: `specs/tasks.md` is a ledger of shipped `[x]` entries ("HC-1..HC-9" in
// a 2026-06 entry is what existed then), and `specs/design.md` records decisions
// at their moment. Both would need ~15 inline markers apiece to say what this
// one line says. Everything describing the CURRENT product — READMEs,
// QUICKSTART, the cut-gate checklists, the glossary — is checked.
const RANGE_RULE_EXEMPT = new Set(['specs/tasks.md', 'specs/design.md']);

/**
 * The `HC-1..HC-N` range notation is a count claim in disguise, and it is how
 * the cut-gate guides actually phrase it ("11 checks now (HC-1..HC-11)"). The
 * noun scan misses it because the surrounding word is a bare "checks", which is
 * far too generic to match safely. The range is unambiguous and kit-specific,
 * so it gets its own rule: the upper bound IS the claimed size.
 *
 * Found while fixing the drift the narrowed docs/process/ exemption exposed —
 * four more guides carried a stale range the noun scan could not see.
 */
export function extractRangeClaims(text) {
  const out = [];
  const lines = String(text).split(/\r?\n/);
  const re = /\bHC-0*1\s*(?:\.\.|-|–|—|\bthrough\b|\bto\b)\s*HC-(\d{1,3})\b/gi;
  for (let i = 0; i < lines.length; i += 1) {
    for (const m of lines[i].matchAll(re)) {
      out.push({ n: Number(m[1]), collection: 'healthChecks', line: i + 1, raw: m[0].trim() });
    }
  }
  return out;
}

/**
 * Compare every claim against the live count. Pure — `live` is injected so the
 * check is testable without importing the kit's registries.
 *
 * @param {object} a
 * @param {Array<{path: string, text: string}>} a.docs
 * @param {Record<string, number>} a.live
 * @returns {string[]} errors
 */
export function checkCounts({ docs, live }) {
  const errors = [];
  for (const { path, text } of docs) {
    if (isFrozenRecord(path)) continue;
    const lines = String(text).split(/\r?\n/);
    const norm = String(path).replace(/\\/g, '/');
    const claims = [
      ...extractCountClaims(text),
      ...(RANGE_RULE_EXEMPT.has(norm) ? [] : extractRangeClaims(text)),
    ];
    for (const claim of claims) {
      const actual = live[claim.collection];
      if (typeof actual !== 'number' || claim.n === actual) continue;
      const lineText = lines[claim.line - 1] ?? '';
      if (SUPPRESSIONS.some((marker) => lineText.includes(marker))) continue;
      const label = COUNT_COLLECTIONS[claim.collection].label;
      errors.push(
        `${path}:${claim.line} claims ${claim.n} ${label} ("${claim.raw}") but the live count is ${actual} — ` +
          `update the prose, or add <!-- validate-docs: ignore --> if the number is deliberately historical`,
      );
    }
  }
  return errors;
}

async function familyCounts() {
  const { subcommands } = await import(
    pathToFileURL(join(SCRIPT_REPO, 'packages', 'cli', 'src', 'subcommands.mjs')).href
  );
  const { AGENT_PROFILES } = await import(
    pathToFileURL(join(SCRIPT_REPO, 'packages', 'cli', 'src', 'agent-profiles.mjs')).href
  );
  const mcpSrc = readFileSync(join(SCRIPT_REPO, 'packages', 'cli', 'src', 'mcp-server.mjs'), 'utf8');
  // HC ids are the doctor's contract surface, but they are NOT all declared in
  // doctor.mjs — HC-9 lives in version-drift.mjs (Task 162). Scanning only the
  // doctor undercounted by one, which is exactly the drift this family exists
  // to catch, committed by the family itself. Scan the whole src tree.
  const srcDir = join(SCRIPT_REPO, 'packages', 'cli', 'src');
  const hcIds = new Set();
  for (const f of readdirSync(srcDir)) {
    if (!f.endsWith('.mjs')) continue;
    for (const m of readFileSync(join(srcDir, f), 'utf8').matchAll(/\bid:\s*'(HC-\d+)'/g)) {
      hcIds.add(m[1]);
    }
  }

  const live = {
    mcpTools: parseMcpToolParams(mcpSrc).size,
    cliVerbs: new Set(subcommands.map((s) => s.name)).size,
    healthChecks: hcIds.size,
    agentProfiles: Object.keys(AGENT_PROFILES).length,
  };

  // Scan every LIVING markdown doc in the repo — that is the whole point.
  const docs = walkMdRec(REPO)
    .map((abs) => ({ path: relPosix(REPO, abs), abs }))
    .filter((d) => !d.path.includes('node_modules/'))
    .filter((d) => !isFrozenRecord(d.path))
    .map((d) => ({ path: d.path, text: readFileSync(d.abs, 'utf8') }));

  const errors = checkCounts({ docs, live });
  const shown = Object.entries(live).map(([k, v]) => `${v} ${COUNT_COLLECTIONS[k].label}`).join(' / ');
  return {
    errors,
    summary: `counts: ${docs.length} living doc(s) scanned against the live registry (${shown})`,
  };
}

// ====================================================================
// FAMILY: brevity — the README's front door stays scannable
// ====================================================================
//
// The "document user-facing capabilities in the same PR" rule (D-17) is
// binding and correct, but it only ever said ADD A LINE — so across 19
// releases the Features section grew by accretion into 19 bullets averaging
// 85 words (longest: 179), i.e. more prose than the ENTIRE README of every
// comparable tool measured: datasette 489 words / uv 1,080 / claude-mem
// 1,691 / turso 2,158, none with a bullet over 22 words. A front door that
// takes six minutes to read is not a front door.
//
// The cap is deliberately generous (25 > the 22-word max of the whole
// comparison set) so it catches the accretion class, not a well-judged
// sentence. Detail belongs in docs/FEATURES.md, which this check requires
// the section to link to — the two halves of the same rule.
const README_BULLET_MAX_WORDS = 25;
const FEATURES_DETAIL_DOC = 'docs/FEATURES.md';

function familyBrevity() {
  const errors = [];
  const readmePath = join(REPO, 'README.md');
  const text = readFileSync(readmePath, 'utf8');

  const start = text.indexOf('\n## Features');
  if (start < 0) {
    return { errors, summary: 'brevity: no "## Features" section in README.md — nothing to check' };
  }
  const rest = text.slice(start + 1);
  const endRel = rest.indexOf('\n## ');
  const section = endRel < 0 ? rest : rest.slice(0, endRel);

  const bullets = section.split('\n').filter((l) => /^[-*] /.test(l));
  for (const b of bullets) {
    const words = b.replace(/^[-*]\s+/, '').split(/\s+/).filter(Boolean).length;
    if (words > README_BULLET_MAX_WORDS) {
      const lead = b.replace(/^[-*]\s+/, '').slice(0, 60);
      errors.push(
        `README.md "## Features" bullet runs ${words} words (max ${README_BULLET_MAX_WORDS}): "${lead}…" — ` +
          `keep the README line short and move the detail to ${FEATURES_DETAIL_DOC}.`,
      );
    }
  }
  if (!section.includes(FEATURES_DETAIL_DOC)) {
    errors.push(
      `README.md "## Features" must link to ${FEATURES_DETAIL_DOC} — the short list is only half the rule; ` +
        'the detail has to have somewhere to live.',
    );
  }

  return {
    errors,
    summary: `brevity: ${bullets.length} README feature bullet(s), all within ${README_BULLET_MAX_WORDS} words, detail doc linked`,
  };
}

// ====================================================================
// CLI
// ====================================================================

const FAMILIES = new Map([
  ['registry', familyRegistry],
  ['references', familyReferences],
  ['catalogs', familyCatalogs],
  ['coverage', familyCoverage],
  ['counts', familyCounts],
  ['brevity', familyBrevity],
]);

async function runCli() {
  const args = process.argv.slice(2);
  let selected = [...FAMILIES.keys()];
  const valid = [...FAMILIES.keys()].join(', ');
  const die = (msg) => {
    console.error(`validate-docs: ${msg} — valid families: ${valid}`);
    console.error('  usage: validate-docs.mjs [--only <family>[,<family>...]]');
    process.exit(1);
  };

  // Accept BOTH `--only x` and `--only=x`. Skill-review B2: matching only the
  // bare flag meant `--only=catalogs` was silently ignored and the run fell
  // through to ALL families — failing open in the opposite direction from B1.
  const onlyIdx = args.findIndex((a) => a === '--only' || a.startsWith('--only='));
  if (onlyIdx !== -1) {
    const arg = args[onlyIdx];
    const raw = arg.startsWith('--only=') ? arg.slice('--only='.length) : (args[onlyIdx + 1] ?? '');
    // Skill-review B1 (the worst one): `--only` with no value produced an EMPTY
    // selection, so the loop ran zero families and printed `OK` with exit 0 — a
    // validator reporting success while checking nothing. An empty value is now
    // the same loud error as an unknown family.
    const names = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))];
    if (names.length === 0) die("`--only` requires at least one family");
    for (const n of names) if (!FAMILIES.has(n)) die(`unknown family '${n}'`);
    selected = names;
  }
  // Reject unknown flags rather than ignoring them (the same fail-open class).
  for (const a of args) {
    if (a.startsWith('--') && a !== '--only' && !a.startsWith('--only=')) die(`unknown flag '${a}'`);
  }

  const summaries = [];
  let failed = false;
  const ranReferences = selected.includes('references');
  for (const name of selected) {
    const result = await FAMILIES.get(name)();
    if (result.errors.length > 0) {
      failed = true;
      console.error(`validate-docs[${name}]: FAIL — ${result.errors.length} issue(s)`);
      for (const e of result.errors) console.error('  - ' + e);
    }
    summaries.push(result.summary);
  }

  if (failed) {
    // Skill-review M6: the suppression hint only applies to the `references`
    // family — printing it after a registry/catalogs/coverage failure gave
    // irrelevant remediation (markers aren't honored outside references).
    if (ranReferences) {
      console.error('');
      console.error('  If a REFERENCE violation is intentional (e.g. a reserved-future ADR');
      console.error('  number), add <!-- validate-docs: ignore --> on the same line.');
      console.error('  (Suppression markers apply to the `references` family only.)');
    }
    process.exit(1);
  }
  console.log(`validate-docs: OK — ${summaries.join('; ')}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
