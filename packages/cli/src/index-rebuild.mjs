// SQLite index rebuild + runtime file-watcher (Task 29, T-025).
//
// Composes on top of:
//   - index-db.mjs       (Task 28) — schema + openIndexDb
//   - provenance.mjs     (Task 13) — readBullet (parses bullet+comment pairs)
//   - frontmatter.mjs    (Task 7)  — parse (YAML frontmatter for fact files)
//   - tier-paths.mjs     — resolveTierRoot, resolveFactDir, ID_PATTERN
//
// Public surface:
//   listObservationSources({projectRoot, userDir})
//     Returns absolute paths of every markdown file the kit treats as a
//     source of observations: <tier>/MEMORY.md + <tier>/memory/*.md
//     across the P / L / U tiers. Caller-skipped: today-{date}.md
//     compression archives (Haiku output isn't kit-canonical bullet+comment
//     shape — see design §16.x as a v0.1.x candidate to index session
//     compressions as observations once Haiku's output schema is pinned).
//
//   reindexBoot({projectRoot, userDir, db})
//     Walk every source file. For each: compute sha1 of file content;
//     compare against the `files` checkpoint table. Skip unchanged.
//     Reindex changed: DELETE all rows where source_file = path, parse
//     observations, INSERT, UPSERT files row. Atomic per-file via SQLite
//     transaction so a partial reindex never leaves a half-written file.
//
//   reindexFull({projectRoot, userDir, db})
//     DROP observations / observations_fts / files tables; re-apply
//     INDEX_DB_SCHEMA; walk + reindex every source unconditionally.
//     Faster than DELETE FROM observations for large indexes because
//     the FTS5 delete trigger doesn't fire per row.
//
//   startRuntimeWatcher({projectRoot, userDir, db, debounceMs})
//     chokidar watcher over the same source paths as listObservationSources.
//     Debounced 500ms by default per design §9.2. Returns {close()} so the
//     caller can shut down cleanly (tests, hook handlers).
//
// Design §9.2 reindex strategy:
//   - Boot: walk + diff mtime+sha1 vs files table → reindex changed only
//   - Runtime: chokidar 500ms debounce → reindex on FS event
//   - Recovery: drop DB + rebuild from markdown
//
// Per CLAUDE.md "Shared modules" rule, this module imports from the
// established sources of truth and does NOT re-implement bullet/frontmatter
// parsing or path resolution.

import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import chokidar from 'chokidar';
import { INDEX_DB_SCHEMA } from './index-db.mjs';
import { hashContent } from './content-hash.mjs';
import { syncTranscriptChunks } from './transcript-index.mjs';
import { readBullet, parseBulletProvenance, isSeedProvenance } from './provenance.mjs';
import { parse as parseFrontmatter } from './frontmatter.mjs';
import { stripBom } from './read-json.mjs';
import { listFactFiles } from './fact-store.mjs';
import { initTrustScore } from './trust-score.mjs';
import { rebuildEdges, edgesBuilt } from './graph-index.mjs';
import { refreshLinkFloors, readLinkFloor } from './link-facts.mjs';

// Task 262: how far the live-fact count may drift from the count a stored
// linking floor was derived on before the boot path re-derives it. 50% is one
// doubling / halving — big enough that a normal session's captures never
// trigger a re-derivation, small enough that a floor can't describe a corpus
// twice its size.
const LINK_FLOOR_DRIFT_RATIO = 0.5;
import {
  VALID_TIERS,
  SCRATCHPADS_BY_TIER,
  resolveTierRoot,
  resolveFactDir,
  ID_PATTERN,
} from './tier-paths.mjs';

// --- File listing -----------------------------------------------------

/**
 * Enumerate the observation-source files across all three tiers.
 * Returns objects with absolute path + the tier it belongs to + the
 * file kind ('scratchpad' or 'fact') so callers don't have to
 * re-derive the parsing strategy.
 */
export function listObservationSources({ projectRoot, userDir }) {
  const sources = [];
  for (const tier of ['P', 'L', 'U']) {
    const root = resolveTierRoot({ tier, projectRoot, userDir });
    if (!existsSync(root)) continue;
    // Scratchpads: EVERY canonical scratchpad for the tier, not just MEMORY.md
    // (Task 182 / D-247). Pre-182 this hardcoded `<tier>/MEMORY.md`, so the
    // project-tier SOUL.md AND the entire user-tier persona (USER/HABITS/
    // LESSONS.md — where `cmk lessons promote` writes) were never indexed, and
    // a promoted persona fact was unsearchable even in-session. Iterating
    // SCRATCHPADS_BY_TIER (the same allow-list the writer/cap layer uses) fixes
    // all of them at once with no filename drift. They all share the
    // bullet + provenance-comment shape the scratchpad parser already handles.
    for (const scratchpadName of SCRATCHPADS_BY_TIER[tier] ?? []) {
      const scratchpad = join(root, scratchpadName);
      if (existsSync(scratchpad)) {
        sources.push({ path: scratchpad, tier, kind: 'scratchpad' });
      }
    }
    // Granular fact files: <tier>/memory/*.md (excluding INDEX.md)
    const factDir = resolveFactDir(tier, root);
    for (const filename of listFactFiles(factDir)) {
      sources.push({
        path: join(factDir, filename),
        tier,
        kind: 'fact',
      });
    }
  }
  return sources;
}

// --- Helpers ----------------------------------------------------------

// Content fingerprint for the `files`-table mtime+sha1 diff key. The column
// name stays `sha1` for checkpoint back-compat; hashContent is SHA-256 (D-149).
// On the first boot after the algorithm change every checkpoint mismatches
// once and self-heals via the normal reindex.
function sha1OfContent(content) {
  return hashContent(content);
}

function isoToEpochMs(iso) {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

function relativeSource(absPath, { projectRoot, userDir }) {
  // Sibling-prefix guard: a naive startsWith() check would misclassify
  // "/foo-other/x.md" as inside "/foo". The path-separator suffix
  // ensures we only match true descendants. Surfaced as Important
  // finding I2 by the Task 29 code-review.
  const sep = process.platform === 'win32' ? /[\\/]/ : '/';
  function isInside(parent, child) {
    if (!parent) return false;
    if (!child.startsWith(parent)) return false;
    if (child.length === parent.length) return false;
    const next = child.charAt(parent.length);
    return process.platform === 'win32'
      ? next === '\\' || next === '/'
      : next === '/';
  }
  if (isInside(userDir, absPath)) {
    return relative(userDir, absPath).replaceAll('\\', '/');
  }
  return relative(projectRoot, absPath).replaceAll('\\', '/');
}

// --- Parsing ----------------------------------------------------------

/**
 * Parse a scratchpad (MEMORY.md / SOUL.md / USER.md / HABITS.md / LESSONS.md /
 * machine-paths.md / overrides.md — any of SCRATCHPADS_BY_TIER) into observations.
 *
 * Walks line-by-line tracking the most recent h2 heading. For each
 * bullet+comment pair, calls readBullet() to extract id/text/provenance.
 * Scaffold `(example)` seed bullets (all-zero sha1) are skipped (Task 183).
 * Returns one row per bullet conforming to the observations schema.
 *
 * Tolerant: bullets without a following provenance comment are skipped
 * (the kit's writeBullet always emits both). Bullets whose readBullet()
 * returns null (malformed id, missing required provenance fields) are
 * skipped — the broader markdown file still indexes its valid bullets.
 */
export function parseObservationsFromScratchpad({
  path,
  content,
  tier,
  projectRoot,
  userDir,
}) {
  // Task 139 (D-126): CRLF-tolerant read — autocrlf clones rewrite the
  // committed memory files; a strict-\n split left \r on every line and
  // the bullet/provenance regexes went blind.
  //
  // Task 257 (D-403): BOM-tolerant too. The scratchpad walk does NOT go through
  // frontmatter.parse (bullets carry HTML-comment provenance, not YAML), so the
  // shared-parser fix does not reach it: a BOM'd MEMORY.md blinded the `^##`
  // heading regex and the bullet regex on LINE 1 only — a bounded but real hole
  // (the first line's heading_path silently degraded to the bare filename). Strip
  // for PARSING only; the sha1 below stays over the RAW content, because adding
  // or removing a BOM IS a file change and must invalidate the `files`
  // change-detection key rather than read as "unchanged".
  const lines = stripBom(content).split(/\r?\n/);
  const sha1 = sha1OfContent(content);
  const source_file = relativeSource(path, { projectRoot, userDir });
  const baseName = basename(path);

  const observations = [];
  let currentHeading = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = /^##\s+(.+)$/.exec(line);
    if (headingMatch) {
      currentHeading = headingMatch[1].trim();
      continue;
    }
    // Try to parse this line as a bullet, with line i+1 as the
    // provenance comment.
    const next = lines[i + 1] ?? '';
    const bullet = readBullet({ bulletLine: line, commentLine: next });
    if (!bullet) continue;
    const { id, text, provenance } = bullet;
    // Task 183 (D-247): skip scaffold `(example)` seed bullets (all-zero sha1)
    // — they must never enter the search index, else a fresh install returns
    // only misleading placeholders. Mirrors the inject path's existing seed
    // filter (shared `isSeedProvenance`, so both surfaces stay in agreement).
    if (isSeedProvenance(provenance)) continue;
    const heading_path = currentHeading
      ? `${baseName} > ${currentHeading}`
      : baseName;
    observations.push({
      id,
      tier,
      source_file,
      source_line: i + 1,
      source_sha1: sha1,
      heading_path,
      body: text,
      write_source: provenance.write,
      trust: provenance.trust,
      created_at: isoToEpochMs(provenance.at),
      superseded_by: provenance.superseded_by ?? null,
      deleted_at: null, // scratchpads don't tombstone in place
      expires_at: null, // bullets never expire — they age via consolidation (66.3)
    });
    // Skip the comment line so we don't try to parse it as a bullet.
    i++;
  }
  return { observations, sha1 };
}

/**
 * Parse a granular fact file into a single observation.
 *
 * Per-fact files have YAML frontmatter (id, type, title, source, sha1,
 * write_source, trust, at, optional deleted_at + superseded_by) and a
 * markdown body. The whole file = one observation row.
 */
export function parseObservationsFromFactFile({
  path,
  content,
  tier,
  projectRoot,
  userDir,
}) {
  const sha1 = sha1OfContent(content);
  const source_file = relativeSource(path, { projectRoot, userDir });
  const baseName = basename(path);
  const { frontmatter, body, parseError } = parseFrontmatter(content);
  if (!frontmatter || parseError) {
    return { observations: [], sha1, skipped: parseError ?? 'no frontmatter' };
  }
  if (!frontmatter.id || !ID_PATTERN.test(frontmatter.id)) {
    return { observations: [], sha1, skipped: 'invalid or missing id' };
  }
  // Kit's writeFact (see packages/cli/src/write-fact.mjs:96-115) writes
  // these field names: `created_at` (not `at`), `source_file` (not
  // `source`), `source_sha1` (not `sha1`). An earlier draft of this
  // parser used the shorter `at`/`source`/`sha1` names — surfaced by
  // Task 29's code-review-excellence pass as a separately-correct-
  // jointly-broken composition gap that would have made reindex a
  // no-op for every kit-produced fact file. The fix here reads the
  // canonical writer-emitted names; the test helper (seedFactFile)
  // now uses writeFact() directly so this kind of drift surfaces at
  // TDD time. Per CLAUDE.md "Integration-test coverage for cross-
  // module flows".
  if (!frontmatter.write_source || !frontmatter.trust || !frontmatter.created_at) {
    return {
      observations: [],
      sha1,
      skipped: 'missing write_source / trust / created_at',
    };
  }
  // The kit's "type" field becomes the heading_path qualifier.
  const heading_path = frontmatter.type
    ? `${baseName} > ${frontmatter.type}`
    : baseName;
  // Important: the observations table's `source_file` field means
  // "on-disk location of the markdown that holds this observation"
  // (e.g., `memory/<fact>.md` for per-fact files, `MEMORY.md` for
  // scratchpad bullets). It is NOT the frontmatter's `source_file`
  // field, which is provenance — "where did this fact ORIGINATE
  // from" (e.g., a MEMORY.md bullet that was promoted to a fact via
  // `cmk promote`). The two concepts share a field name but have
  // different semantics. The DELETE-then-INSERT pattern in
  // replaceObservationsForFile keys on the on-disk location, so the
  // index must use that interpretation. The provenance lineage is
  // retrievable by reading the fact file's frontmatter when needed.
  // source_sha1 is similarly the sha1 of the file being indexed —
  // used as the diff key in reindexBoot's mtime+sha1 checkpoint.
  const observation = {
    id: frontmatter.id,
    tier,
    source_file,
    source_line: 1, // frontmatter starts at line 1
    source_sha1: sha1,
    heading_path,
    body: (body ?? '').trim() || (frontmatter.title ?? ''),
    write_source: frontmatter.write_source,
    trust: frontmatter.trust,
    // 151.8: the committed recurrence_count (151.1) seeds the trust_score's
    // DURABLE restatement term — survives every reindex (reconstructed from this).
    // Floor to 1 for a missing OR malformed (≤0) value — consistent with the other
    // four recurrence readers (write-fact / assembleProjectCorpus / trust-score)
    // which all treat <1 as the 1× baseline (the field starts at 1, only increments).
    recurrence_count: Number.isFinite(frontmatter.recurrence_count) && frontmatter.recurrence_count > 0
      ? frontmatter.recurrence_count
      : 1,
    created_at: isoToEpochMs(frontmatter.created_at),
    superseded_by: frontmatter.superseded_by ?? null,
    deleted_at: frontmatter.deleted_at ? isoToEpochMs(frontmatter.deleted_at) : null,
    // Task 66.3: the declared validity end → epoch ms, NULL = permanent.
    // frontmatter.mjs uses CORE_SCHEMA, which keeps ISO strings as STRINGS
    // (no timestamp resolution) — the Date normalization guards files touched
    // by a non-kit YAML parser (same as expiry-sweep.mjs). A malformed
    // hand-edited value indexes as NULL (permanent) rather than crashing the
    // reindex; the sweep separately reports it as skipped_malformed.
    expires_at: parseExpiresAtMs(frontmatter.expires_at),
  };
  return { observations: [observation], sha1 };
}

// Task 66.3 helper: frontmatter expires_at (string | Date | absent) → epoch ms | null.
function parseExpiresAtMs(raw) {
  if (raw === undefined || raw === null) return null;
  const s = raw instanceof Date ? raw.toISOString() : String(raw);
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? null : ms;
}

function parseSource(source, { projectRoot, userDir }) {
  const content = readFileSync(source.path, 'utf8');
  if (source.kind === 'scratchpad') {
    return parseObservationsFromScratchpad({
      path: source.path,
      content,
      tier: source.tier,
      projectRoot,
      userDir,
    });
  }
  return parseObservationsFromFactFile({
    path: source.path,
    content,
    tier: source.tier,
    projectRoot,
    userDir,
  });
}

// --- DB write helpers -------------------------------------------------

// Bug 1 (2026-06-16, fact P-UCG4RKNL): the kit dual-writes a fact to BOTH the
// MEMORY.md scratchpad bullet AND its granular archive file, both carrying the
// SAME content-addressed id. `observations.id` is a global PRIMARY KEY, so a
// plain INSERT of the second source's row collided (`UNIQUE constraint failed:
// observations.id`) and aborted the whole reindex. The fix is id-keyed upsert
// with deterministic ARCHIVE-BEATS-SCRATCHPAD precedence — validated against
// three markdown-first analogs that all key replacement on the id, never the
// file (TencentDB `ON CONFLICT(record_id) DO UPDATE`; basic-memory
// resolve-permalink precedence + partial unique index; memweave content-hash
// dedup). See docs/research/2026-06-16-index-uniqueness-id-vs-file-scoped-delete.md.
//
// Two precedence-keyed paths, order-INDEPENDENT (the source walk order must not
// change the surviving row):
//   - fact (granular archive = the canonical Why/How home) → explicit
//     DELETE-by-id then INSERT: always wins, overwriting any scratchpad row for
//     the id.
//   - scratchpad (the hot working-copy bullet) → ON CONFLICT(id) DO NOTHING:
//     inserts only when no row exists yet; never overwrites a fact row.
// Whichever is walked first, the fact row is the one that survives.
//
// FTS5 CORRECTNESS (the self-review catch): the fact path uses an explicit
// DELETE-by-id, NOT `INSERT OR REPLACE`. `observations_fts` is an
// external-content FTS5 table whose only safe delete path is the
// `obs_after_delete` trigger firing the 'delete' SENTINEL with the OLD row's
// column values (index-db.mjs §4.4.3 comment). `INSERT OR REPLACE` reuses the
// conflicting row's rowid, so its internal delete+insert leaves the OLD
// scratchpad body orphaned in the FTS index (it keeps MATCH-ing with no backing
// row — silent stale-hit corruption). An explicit `DELETE FROM observations
// WHERE id = ?` fires obs_after_delete cleanly (sentinel removes the old terms),
// then the plain INSERT fires obs_after_insert. This is the same delete-then-
// insert pattern every other writer in the kit uses against this table.

const DELETE_OBSERVATION_BY_ID_SQL = `DELETE FROM observations WHERE id = ?`;

const INSERT_OBSERVATION_SQL = `
INSERT INTO observations
  (id, tier, source_file, source_line, source_sha1, heading_path, body,
   write_source, trust, trust_score, created_at, superseded_by, deleted_at, expires_at)
VALUES
  (@id, @tier, @source_file, @source_line, @source_sha1, @heading_path, @body,
   @write_source, @trust, @trust_score, @created_at, @superseded_by, @deleted_at, @expires_at)
`;

const INSERT_SCRATCHPAD_OBSERVATION_SQL = `
INSERT INTO observations
  (id, tier, source_file, source_line, source_sha1, heading_path, body,
   write_source, trust, trust_score, created_at, superseded_by, deleted_at, expires_at)
VALUES
  (@id, @tier, @source_file, @source_line, @source_sha1, @heading_path, @body,
   @write_source, @trust, @trust_score, @created_at, @superseded_by, @deleted_at, @expires_at)
ON CONFLICT(id) DO NOTHING
`;

const UPSERT_FILE_SQL = `
INSERT INTO files (path, mtime, sha1, indexed_at)
VALUES (@path, @mtime, @sha1, @indexed_at)
ON CONFLICT(path) DO UPDATE SET
  mtime = excluded.mtime,
  sha1 = excluded.sha1,
  indexed_at = excluded.indexed_at
`;

const DELETE_OBSERVATIONS_FOR_PATH_SQL = `DELETE FROM observations WHERE source_file = ?`;

/**
 * Replace all observations for a single source file. Caller-wrapped
 * in a transaction. The FTS5 delete-then-insert pattern fires the
 * documented sync triggers (external-content sentinel + new insert).
 */
function replaceObservationsForFile(db, { source, observations, mtime, sha1, projectRoot, userDir, now }) {
  const source_file = relativeSource(source.path, { projectRoot, userDir });
  // File-scoped delete clears THIS file's own rows so a re-index of a changed
  // file is idempotent. It only matches rows whose source_file is this path, so
  // a fact's row (source_file = context/memory/*.md) is untouched when the
  // scratchpad (context/MEMORY.md) is re-indexed, and vice versa — the
  // cross-file id collision is handled by the precedence-keyed insert below,
  // NOT by this delete (Bug 1).
  db.prepare(DELETE_OBSERVATIONS_FOR_PATH_SQL).run(source_file);
  // Archive-beats-scratchpad precedence (Bug 1): a fact row wins the id by
  // explicitly deleting any existing row for that id first (firing the FTS
  // 'delete' sentinel cleanly) then inserting; a scratchpad row yields via
  // ON CONFLICT(id) DO NOTHING. Within a FULL pass (reindexFull, or a
  // reindexBoot that re-walks both sources) this is order-independent — the
  // fact row always wins (listObservationSources walks scratchpad-before-facts
  // per tier, but either order lands the same surviving row).
  //
  // INCREMENTAL caveat (skill-review I1): on the mtime-skip boot path / the
  // single-file watcher path, only the CHANGED source is re-processed. If a
  // fact file is removed while its scratchpad twin (same id) is untouched, the
  // orphan-prune drops the fact row and the skipped scratchpad's DO-NOTHING
  // insert never re-fires — so the id momentarily vanishes from search until
  // the scratchpad is next edited (which re-inserts it). `cmk forget` does NOT
  // hit this: it tombstones the fact AND scrubs the scratchpad bullet in the
  // same op (forget.mjs scrubAllScratchpads), so the only window is a manual
  // hand-`rm` of a context/memory/*.md leaving the bullet behind — a rare,
  // self-healing transition, documented + tested rather than resurrected.
  //
  // The DELETE-by-id is UNQUALIFIED (no tier/source_file filter) by design and
  // safe: ids are content-addressed WITH the tier as a prefix (`P-`/`L-`/`U-`),
  // so a P-tier and U-tier fact can never share an id — no cross-tier delete is
  // possible. (Defended by the P/U-same-content tier test below.)
  // 151.6/151.8: seed trust_score from the fact's committed signals — enum +
  // source + the DURABLE recurrence term (151.8: a re-stated fact seeds higher,
  // reconstructed from the committed recurrence_count so it survives every
  // reindex). Computed here at insert (one place). `recurrence_count` is consumed
  // by the seed but is NOT an `observations` column, so it's stripped from the
  // bound row (better-sqlite3 rejects unknown named params). The asymmetric
  // DAMPEN deltas (151.8 contradiction/supersession) stay as runtime overlays on
  // the trust_score column — they survive a boot reindex (unchanged files skipped)
  // and reseed only on a full rebuild (the local-protection-signal posture, D-237).
  const withTrustScore = (obs) => {
    const { recurrence_count, ...row } = obs;
    return {
      ...row,
      trust_score: initTrustScore({
        trust: obs.trust,
        writeSource: obs.write_source,
        recurrenceCount: recurrence_count,
      }),
    };
  };
  if (source.kind === 'fact') {
    const deleteById = db.prepare(DELETE_OBSERVATION_BY_ID_SQL);
    const insert = db.prepare(INSERT_OBSERVATION_SQL);
    for (const obs of observations) {
      deleteById.run(obs.id);
      insert.run(withTrustScore(obs));
    }
  } else {
    const insert = db.prepare(INSERT_SCRATCHPAD_OBSERVATION_SQL);
    for (const obs of observations) {
      insert.run(withTrustScore(obs));
    }
  }
  db.prepare(UPSERT_FILE_SQL).run({
    path: source_file,
    mtime,
    sha1,
    indexed_at: now,
  });
}

// --- Public API: boot / full / watcher --------------------------------

/**
 * Boot reindex: walk source files; reindex only those whose sha1
 * differs from the `files` checkpoint.
 *
 * @returns {object} {filesScanned, filesReindexed, observationsAffected,
 *                    durationMs, skipped: [{path, reason}]}
 */
export function reindexBoot({ projectRoot, userDir, db, now }) {
  const t0 = Date.now();
  const ts = now ?? t0;
  const sources = listObservationSources({ projectRoot, userDir });
  const skipped = [];
  let filesScanned = 0;
  let filesReindexed = 0;
  let observationsAffected = 0;

  const txn = db.transaction((source) => {
    const stat = statSync(source.path);
    const mtime = Math.floor(stat.mtimeMs);
    const result = parseSource(source, { projectRoot, userDir });
    if (result.skipped) {
      skipped.push({ path: source.path, reason: result.skipped });
      return 0;
    }
    replaceObservationsForFile(db, {
      source,
      observations: result.observations,
      mtime,
      sha1: result.sha1,
      projectRoot,
      userDir,
      now: ts,
    });
    // observationsAffected counts insert-ATTEMPTS, not net rows: a fact that
    // displaces a same-id scratchpad row (Bug 1 precedence) is net-zero but
    // counts as one here. It's a "work done" metric, not a row-count invariant.
    return result.observations.length;
  });

  for (const source of sources) {
    filesScanned++;
    const relPath = relativeSource(source.path, { projectRoot, userDir });
    const existing = db
      .prepare('SELECT mtime, sha1 FROM files WHERE path = ?')
      .get(relPath);
    // Fast path: if the file's mtime matches the checkpoint, the content is
    // unchanged — skip the read + sha1 entirely. This realizes design §9.2's
    // "mtime+sha1 diff" intent (the prior impl sha1'd every file on every
    // call) and is what makes reindexBoot cheap enough to run before every
    // `cmk search` (finding #0) even as the memory corpus grows.
    let mtime = null;
    try {
      mtime = Math.floor(statSync(source.path).mtimeMs);
    } catch {
      // stat failed (file vanished mid-walk); fall through to the read,
      // which surfaces the error naturally.
    }
    if (existing && mtime !== null && existing.mtime === mtime) {
      continue; // unchanged (mtime match — no read needed)
    }
    // Caveat: a content change that PRESERVES the old mtime (e.g. a restore
    // tool that sets --times) is missed until the next real change or a
    // `reindex --full`. Negligible in practice — the kit always writes a
    // fresh mtime after the indexed one — and standard for mtime-based diffs.
    //
    // mtime differs (or no checkpoint) — confirm via sha1 so a mere mtime
    // touch (content identical) doesn't trigger a needless reindex.
    const content = readFileSync(source.path, 'utf8');
    const sha1 = sha1OfContent(content);
    if (existing && existing.sha1 === sha1) {
      continue; // content unchanged despite mtime touch
    }
    const n = txn(source);
    filesReindexed++;
    observationsAffected += n;
  }

  // Prune orphans (Task 110 / F-7). The walk above only ADDS/UPDATES files that
  // still exist; a file removed since the last index (e.g. a fact `cmk forget`
  // moved to archive/tombstones/, or a queue-discard) leaves its observation
  // rows behind, so the forgotten fact keeps surfacing in `cmk search` until a
  // manual `reindex --full`. Drop any `files` checkpoint whose source is no
  // longer on disk, plus its observations (the FTS5 delete trigger fires per
  // row). This makes boot a full sync (add/update/DELETE), so every index
  // reader — all of which lazy-call reindexBoot first — self-heals after any
  // removal with no manual command (the D-85 "everything automatic" contract).
  //
  // SAFETY (composition guard): the prune deletes any known row NOT in the
  // current live-set, so it is only sound when the live-set is COMPLETE across
  // every tier the index covers. The U tier is walked only when `userDir` is
  // provided; without it, U sources are absent from `liveRelPaths` and a real
  // U-tier row would be mis-pruned as an orphan. So we prune ONLY when userDir
  // is present (P + L + U all walked). When it's absent we skip — the next
  // reader that passes userDir (every `cmk search`/`get`/… does) self-heals.
  // (projectRoot is always present here — it's required to open the db.)
  let filesPruned = 0;
  let observationsPruned = 0;
  if (userDir) {
    const liveRelPaths = new Set(
      sources.map((s) => relativeSource(s.path, { projectRoot, userDir })),
    );
    const pruneTxn = db.transaction((relPath, obsCount) => {
      db.prepare(DELETE_OBSERVATIONS_FOR_PATH_SQL).run(relPath);
      db.prepare('DELETE FROM files WHERE path = ?').run(relPath);
      filesPruned++;
      observationsPruned += obsCount;
    });
    const knownPaths = db.prepare('SELECT path FROM files').all();
    for (const { path: relPath } of knownPaths) {
      // Task 104.2 composition guard: 'transcript:'-prefixed checkpoints
      // belong to the transcript scope (transcript-index.mjs) — they are
      // never in the observation live-set and pruning them here would
      // defeat that scope's checkpoint on every boot. Its own sync prunes
      // its own orphans.
      if (relPath.startsWith('transcript:')) continue;
      if (liveRelPaths.has(relPath)) continue;
      const obsCount = db
        .prepare('SELECT COUNT(*) AS n FROM observations WHERE source_file = ?')
        .get(relPath).n;
      pruneTxn(relPath, obsCount);
    }
  }

  // Task 104.2 — sync the transcript scope (the L3 raw tier) in the same
  // boot pass. Cheap: per-file sha1 checkpoint; best-effort — a transcript
  // sync hiccup must not fail the observation reindex.
  let transcripts = { files: 0, chunks: 0 };
  try {
    transcripts = syncTranscriptChunks({ db, projectRoot, now: ts });
  } catch {
    // best-effort; the next boot retries
  }

  // Task 232 (ADR-0023): refresh the graph edges when anything changed — a
  // fact add/edit/prune can create, resolve, or dangle an edge, and edges are
  // cross-file so the rebuild is wholesale (graph-index.rebuildEdges). Skipped
  // on a no-change boot (the common hot-path case) to keep the every-read
  // reindex cheap — UNLESS the edges have NEVER been built (no meta sentinel),
  // which is the one-time migration case for a pre-232 index: populate it on the
  // next read so the graph self-heals with no manual `reindex --full`. The
  // sentinel (not row emptiness) gates this — a link-free corpus builds an empty
  // edges table ONCE and is never re-walked, so the migration terminates.
  let edgeCount = 0;
  const changed = filesReindexed > 0 || filesPruned > 0;
  let coldEdges = false;
  try {
    coldEdges = !edgesBuilt(db) && db.prepare('SELECT 1 FROM observations LIMIT 1').get() !== undefined;
  } catch {
    coldEdges = false;
  }
  const edgesRebuilt = changed || coldEdges;
  if (edgesRebuilt) {
    try {
      ({ edgeCount } = rebuildEdges(db, { projectRoot, userDir }));
    } catch (err) {
      // best-effort (a broken graph must never fail the observation reindex),
      // but NOT silent: a permanently-failing rebuild leaves a signal (Door 5).
      process.stderr.write(
        `cmk reindex: edge rebuild (boot) failed: ${err?.message ?? err}\n`,
      );
    }
  }

  // Task 262: the write-time linking floor on the BOOT path. A floor that only
  // ever appeared on `reindex --full` would mean a fresh install writes unlinked
  // facts forever (nothing runs a full reindex on its own — the D-298 class), so
  // it is derived here when ABSENT, and re-derived when the corpus has grown or
  // shrunk by more than LINK_FLOOR_DRIFT_RATIO since it was computed (a floor
  // derived from a 40-fact corpus is not the floor of a 400-fact one). Both
  // conditions terminate: a corpus under MIN_FLOOR_ITEMS derives nothing and
  // re-checks only when files actually changed, which is the cheap no-op case.
  let linkFloors = null;
  try {
    const existing = readLinkFloor(db, 'jaccard');
    let stale = !existing;
    if (existing && changed) {
      const { n } = db
        .prepare(
          `SELECT COUNT(*) AS n FROM observations
            WHERE deleted_at IS NULL AND superseded_by IS NULL AND source_file LIKE '%memory/%'`,
        )
        .get();
      const base = Math.max(1, existing.corpusSize ?? 1);
      stale = Math.abs(n - base) / base > LINK_FLOOR_DRIFT_RATIO;
    }
    if (stale && (changed || !existing)) {
      linkFloors = refreshLinkFloors(db, { now: new Date(ts).toISOString() });
    }
  } catch {
    // best-effort: no floor simply means the next writes land unlinked
  }

  return {
    filesScanned,
    filesReindexed,
    observationsAffected,
    linkFloors,
    filesPruned,
    observationsPruned,
    transcriptFiles: transcripts.files,
    transcriptChunks: transcripts.chunks,
    edgeCount,
    edgesRebuilt,
    durationMs: Date.now() - t0,
    skipped,
  };
}

// Task 261 (D-421) — the REPAIR half. Since Task 261 the semantic vec tables
// are keyed by `vec_map` (the fact's stable id), not by `observations.rowid`,
// so a full rebuild no longer desyncs them and this is not needed for
// correctness. It is here because `cmk reindex --full` — and `cmk repair
// --index`, which calls it — is the command the docs and the troubleshooting
// skill prescribe when search looks wrong. Before Task 261 that command was the
// CAUSE of the corruption; it must now be the cure, without asking the user to
// know anything happened. Clearing the version marker makes the next
// `syncSemanticIndex` rebuild the vec layer from scratch (free: the
// content-addressed `embedding_cache` is deliberately NOT touched, so no model
// call is needed for a single vector).
//
// Done by marker rather than by DROPping the tables here, because dropping a
// vec0 virtual table requires the sqlite-vec extension to be loaded on this
// connection — a plain reindex has no reason to load it, and the sync path
// always has. The catch covers an index whose semantic layer was never
// initialised (no `vec_meta` table): nothing to invalidate.
function invalidateSemanticKeying(db) {
  try {
    db.exec("DELETE FROM vec_meta WHERE key = 'map_version'");
  } catch {
    /* no semantic layer on this index — nothing to invalidate */
  }
}

/**
 * Full reindex: drop observations + observations_fts + files tables,
 * re-apply the schema, then walk + reindex every source.
 *
 * Faster than DELETE FROM observations for large indexes because the
 * FTS5 sentinel triggers don't fire per row.
 */
export function reindexFull({ projectRoot, userDir, db, now }) {
  const t0 = Date.now();
  const ts = now ?? t0;
  // Drop + recreate (faster than per-row DELETE). Task 104.2: the transcript
  // scope drops + rebuilds with everything else — `files` carries its
  // checkpoints, so a full reindex must re-chunk from scratch too.
  db.exec(`
    DROP TABLE IF EXISTS observations_fts;
    DROP TRIGGER IF EXISTS obs_after_insert;
    DROP TRIGGER IF EXISTS obs_after_update;
    DROP TRIGGER IF EXISTS obs_after_delete;
    DROP TABLE IF EXISTS observations;
    DROP TABLE IF EXISTS transcript_chunks_fts;
    DROP TRIGGER IF EXISTS tch_after_insert;
    DROP TRIGGER IF EXISTS tch_after_update;
    DROP TRIGGER IF EXISTS tch_after_delete;
    DROP TABLE IF EXISTS transcript_chunks;
    DROP TABLE IF EXISTS files;
    DROP TABLE IF EXISTS edges;
  `);
  db.exec(INDEX_DB_SCHEMA);
  invalidateSemanticKeying(db);
  // Task 261 (D-423) — the SAME class as D-421, one table over. `edges` was
  // just dropped, but `meta` was not, and the schema re-applies with CREATE IF
  // NOT EXISTS — so `meta.edges_built_at` survives, still claiming a build that
  // no longer exists. The rebuild below is best-effort inside a try/catch, so a
  // throw leaves an EMPTY edges table beside a sentinel that says it is built,
  // and `reindexBoot`'s cold-edge path (`!edgesBuilt(db)`) then never rebuilds
  // it — `cmk links` and every backlink answer quietly return nothing until an
  // unrelated file happens to change. `migrateEdgesSchema` in index-db.mjs
  // already pairs these two operations for exactly this reason; pair them here
  // too. Cleared BEFORE the rebuild, so the sentinel is only ever re-written by
  // a rebuild that actually succeeded.
  try {
    db.exec("DELETE FROM meta WHERE key = 'edges_built_at'");
  } catch {
    /* very old index with no meta table — the schema above just created it */
  }

  const sources = listObservationSources({ projectRoot, userDir });
  const skipped = [];
  let filesScanned = 0;
  let observationsAffected = 0;

  const txn = db.transaction((source, sha1) => {
    // sha1 is passed in (not recomputed) so the file-read for sha1
    // matches the content parseSource will read again inside this txn.
    // Tiny TOCTOU window: if the file changes between the outer read
    // (sha1) and parseSource's read, the next reindex picks up the
    // newest content — acceptable for a regenerable read-cache.
    // Surfaced as Important finding I5 (dead `content` arg) in the
    // Task 29 code-review; removed in this commit.
    const stat = statSync(source.path);
    const mtime = Math.floor(stat.mtimeMs);
    const result = parseSource(source, { projectRoot, userDir });
    if (result.skipped) {
      skipped.push({ path: source.path, reason: result.skipped });
      return 0;
    }
    replaceObservationsForFile(db, {
      source,
      observations: result.observations,
      mtime,
      sha1,
      projectRoot,
      userDir,
      now: ts,
    });
    // observationsAffected counts insert-ATTEMPTS, not net rows: a fact that
    // displaces a same-id scratchpad row (Bug 1 precedence) is net-zero but
    // counts as one here. It's a "work done" metric, not a row-count invariant.
    return result.observations.length;
  });

  for (const source of sources) {
    filesScanned++;
    const content = readFileSync(source.path, 'utf8');
    const sha1 = sha1OfContent(content);
    observationsAffected += txn(source, sha1);
  }

  // Task 104.2 — rebuild the transcript scope from scratch (its tables were
  // dropped above). Best-effort, same contract as the boot-path sync.
  let transcripts = { files: 0, chunks: 0 };
  try {
    transcripts = syncTranscriptChunks({ db, projectRoot, now: ts });
  } catch {
    // best-effort; the next reindex retries
  }

  // Task 232 (ADR-0023): rebuild the graph edges from the same markdown. A full
  // reindex ALWAYS rebuilds — the edges table was dropped above and this is the
  // byte-stable rebuild the ADR-0002 constraint requires. Best-effort: an edge
  // hiccup must not fail the observation reindex.
  let edgeCount = 0;
  try {
    ({ edgeCount } = rebuildEdges(db, { projectRoot, userDir }));
  } catch (err) {
    // best-effort (a broken graph must never fail the observation reindex),
    // but NOT silent: a permanently-failing rebuild leaves a signal (Door 5).
    process.stderr.write(
      `cmk reindex: edge rebuild (full) failed: ${err?.message ?? err}\n`,
    );
  }

  // Task 262: RE-DERIVE the write-time linking floors from the corpus that was
  // just indexed. The floor must never be a constant (grill Q3) — it is the p99
  // of THIS corpus's own random-pair similarity under THIS backend, so it moves
  // when the corpus does and is meaningless copied from another repo or another
  // embedder. Derived state in the same rebuildable index as `edges` (ADR-0002),
  // recomputed on every full reindex. Best-effort by the same rule as the edge
  // rebuild: no floor simply means the next writes land unlinked.
  let linkFloors = null;
  try {
    linkFloors = refreshLinkFloors(db, { now: new Date(ts).toISOString() });
  } catch (err) {
    process.stderr.write(
      `cmk reindex: link-floor derivation (full) failed: ${err?.message ?? err}\n`,
    );
  }

  return {
    filesScanned,
    observationsAffected,
    linkFloors,
    transcriptFiles: transcripts.files,
    transcriptChunks: transcripts.chunks,
    edgeCount,
    durationMs: Date.now() - t0,
    skipped,
  };
}

/**
 * Runtime watcher. Returns a handle with .close() so the caller (tests,
 * future hook handler) can shut it down cleanly.
 *
 * Debounce via chokidar's awaitWriteFinish (stability threshold = the
 * caller's debounceMs, default 500ms per design §9.2). On `add` /
 * `change` events: re-parse the touched file + replace its observations.
 * On `unlink`: delete the file's observations (FTS5 sentinel trigger
 * fires for each).
 *
 * Tier inference: paths are matched against the resolved tier roots —
 * a path starting with the projectRoot's context/ is P; context.local/
 * is L; userDir is U.
 */
export function startRuntimeWatcher({
  projectRoot,
  userDir,
  db,
  debounceMs = 500,
}) {
  // chokidar v5 dropped glob support (breaking change from v3). Watch
  // the DIRECTORIES that contain observation-source files; filter events
  // by extension + filename in the handlers. The MEMORY.md scratchpad
  // is a single file so it can be watched directly; the memory/ fact
  // directory is watched as a folder so chokidar receives 'add' events
  // for newly-created per-fact files (e.g., from auto-extract's
  // routeHigh writing a new fact).
  const watchPaths = [];
  const tierRoots = [];
  for (const tier of ['P', 'L', 'U']) {
    const root = resolveTierRoot({ tier, projectRoot, userDir });
    if (!existsSync(root)) continue;
    tierRoots.push({ tier, root });
    // Watch EVERY canonical scratchpad for the tier (Task 182 / D-247), not
    // just MEMORY.md — must stay in lockstep with listObservationSources above,
    // else a live edit to SOUL.md / a `cmk lessons promote` into HABITS.md
    // wouldn't trigger a runtime re-index (indexed on full reindex but not
    // watched — the composition gap the caller-map rule catches).
    for (const scratchpadName of SCRATCHPADS_BY_TIER[tier] ?? []) {
      const scratchpad = join(root, scratchpadName);
      if (existsSync(scratchpad)) watchPaths.push(scratchpad);
    }
    const factDir = resolveFactDir(tier, root);
    if (existsSync(factDir)) watchPaths.push(factDir);
  }
  if (watchPaths.length === 0) {
    return { close: async () => {}, watcher: null };
  }

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: debounceMs,
      pollInterval: 100,
    },
  });

  function tierForPath(p) {
    const np = p.replaceAll('\\', '/');
    for (const { tier, root } of tierRoots) {
      const nr = root.replaceAll('\\', '/');
      // Sibling-prefix guard (I2): require a `/` after the root prefix
      // so "/foo-other/..." doesn't match "/foo". Same logic as
      // relativeSource's isInside helper.
      if (np === nr || np.startsWith(nr + '/')) return tier;
    }
    return null;
  }

  function kindForPath(p) {
    const np = p.replaceAll('\\', '/');
    return /\/memory\/[^/]+\.md$/.test(np) ? 'fact' : 'scratchpad';
  }

  function isObservationSource(absPath) {
    // Filter chokidar events. Watch is over directories; this filter
    // drops non-.md files, INDEX.md (Task 8's pointer index — not an
    // observation source), and anything outside the kit's tier roots.
    if (!absPath.endsWith('.md')) return false;
    if (basename(absPath) === 'INDEX.md') return false;
    return VALID_TIERS.has(tierForPath(absPath));
  }

  function handleChange(absPath) {
    if (!isObservationSource(absPath)) return;
    const tier = tierForPath(absPath);
    const kind = kindForPath(absPath);
    const source = { path: absPath, tier, kind };
    try {
      const content = readFileSync(absPath, 'utf8');
      const sha1 = sha1OfContent(content);
      const result = parseSource(source, { projectRoot, userDir });
      if (result.skipped) return;
      const stat = statSync(absPath);
      const mtime = Math.floor(stat.mtimeMs);
      const txn = db.transaction(() => {
        replaceObservationsForFile(db, {
          source,
          observations: result.observations,
          mtime,
          sha1,
          projectRoot,
          userDir,
          now: Date.now(),
        });
      });
      txn();
    } catch (err) {
      // Best-effort: a partial write or temp-file might trigger an event
      // for a file that's already been replaced. Re-fire on the next event.
      // Log to stderr with the file path so a poison-pill file doesn't
      // fail silently — surfaced as Minor finding M4 by the Task 29
      // code-review.
      process.stderr.write(
        `cmk runtime-watcher: skipped ${absPath}: ${err?.message ?? err}\n`,
      );
    }
  }

  function handleUnlink(absPath) {
    if (!isObservationSource(absPath)) return;
    // Best-effort, mirroring handleChange (Task 218 skill-review #1): chokidar
    // invokes listeners inside its async _emit, so an uncaught throw here becomes
    // an unhandledRejection → process crash in any long-lived watcher consumer —
    // a >5s lock past busy_timeout, a non-BUSY sqlite error, or relativeSource
    // throwing on a malformed path must log + continue, never sink the process.
    // (The MCP server no longer uses this watcher — Task 218 shipped per-query
    // refresh instead, D-329 — but the guard hardens startRuntimeWatcher for any
    // future consumer + matches its handleChange sibling.)
    try {
      const source_file = relativeSource(absPath, { projectRoot, userDir });
      const txn = db.transaction(() => {
        db.prepare(DELETE_OBSERVATIONS_FOR_PATH_SQL).run(source_file);
        db.prepare('DELETE FROM files WHERE path = ?').run(source_file);
      });
      txn();
    } catch (err) {
      process.stderr.write(
        `cmk runtime-watcher: unlink skipped ${absPath}: ${err?.message ?? err}\n`,
      );
    }
  }

  watcher.on('add', handleChange);
  watcher.on('change', handleChange);
  watcher.on('unlink', handleUnlink);

  return {
    watcher,
    close: () => watcher.close(),
  };
}

// `parseBulletProvenance` re-export so a future test can probe a comment
// in isolation without re-importing from provenance.mjs. Kept narrow to
// avoid widening the module's API beyond what callers need.
export { parseBulletProvenance };
