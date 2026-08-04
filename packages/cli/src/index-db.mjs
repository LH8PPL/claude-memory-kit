// SQLite index-DB schema + open function (Task 28, T-024).
//
// The kit's search layer (Layer 5, design §9) is a regenerable
// read-cache at `<projectRoot>/context/.index/memory.db`. Source of
// truth is always the markdown files under `context/`, `context.local/`,
// and the user-tier directory — the DB is rebuilt from those any time
// it diverges (T1 architectural rule).
//
// Schema follows design §9.1 verbatim:
//   - `observations` table mirrors every fact bullet from the markdown
//     tier files (id, tier, source_file, source_line, source_sha1,
//     heading_path, body, write_source, trust, created_at, superseded_by,
//     deleted_at).
//   - `observations_fts` FTS5 virtual table provides BM25 keyword search
//     over the body / heading_path / write_source columns. Three sync
//     triggers (after insert / update / delete) keep the FTS5 mirror
//     consistent with the base table without requiring the caller to
//     manage two write paths.
//   - `files` checkpoint table tracks markdown file mtime + sha1, used
//     by Task 29's reindex strategy (boot-time diff, runtime watcher)
//     to skip files that haven't changed since the last index pass.
//
// Pragma posture:
//   - `journal_mode=WAL` enables many readers + one writer concurrently
//     (the kit reads from the index during `cmk search` while auto-extract
//     or `cmk reindex` may be writing).
//   - `synchronous=NORMAL` is the sqlite-recommended tradeoff for WAL
//     mode — durability is preserved across checkpoint events but a
//     crash between checkpoints can lose the last few transactions.
//     For a regenerable read-cache this is correct: the user can always
//     `cmk reindex --full` to rebuild.
//
// Public boundary (this module):
//   - openIndexDb({projectRoot}) → Database
//   - getIndexDbPath(projectRoot) → string
//   - INDEX_DB_SCHEMA (exported for tests / migration tooling)
//
// Not yet in this task:
//   - reindex orchestration (Task 29)
//   - `cmk search` CLI (Task 30)
//   - MCP server (Task 31)
//
// Task 28 ships ONLY the schema + open function. Callers in Tasks 29-31
// will compose on top.

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const INDEX_DB_RELATIVE = ['context', '.index', 'memory.db'];

/**
 * Full DDL applied at open time. Idempotent — every CREATE has
 * `IF NOT EXISTS` so reopening an existing DB is a no-op.
 *
 * Kept as a single export so tests can assert that the production
 * open path applied the documented schema (no drift between code
 * and design §9.1).
 */
export const INDEX_DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  tier TEXT NOT NULL CHECK(tier IN ('U','P','L')),
  source_file TEXT NOT NULL,
  source_line INTEGER NOT NULL,
  source_sha1 TEXT NOT NULL,
  heading_path TEXT,
  body TEXT NOT NULL,
  write_source TEXT NOT NULL,
  trust TEXT NOT NULL,
  -- Task 151.6 (ADR-0016 §20.2): the evolving PROTECTION field — a FLOAT seeded
  -- from source (user-explicit > auto-extract) on (re)index, then moved by passive
  -- outcomes (151.7/151.8). Lives ONLY here (the rebuildable index), never in
  -- committed frontmatter (D-218). DEFAULT 0.5 so a migrated pre-151.6 row + any
  -- insert that omits it gets a sane medium seed until the next full reindex.
  trust_score REAL NOT NULL DEFAULT 0.5,
  -- Task 194 (ADR-0017 Phase 2 / SYSTEM-MAP §6 "feedback counters"): the count
  -- of APPLIED outcome signals (reinforce/dampen) — the confidence-gate
  -- EVIDENCE for the search blend. A score with no evidence never moves rank
  -- (blend fires only at signal_count ≥ BLEND_MIN_SIGNALS). Same overlay
  -- posture as trust_score (D-237): lives only in the rebuildable index; a
  -- full reindex resets it to 0 — acceptable, the gate then honestly reports
  -- "no evidence" until the loop re-earns it. Recurrence/restatement is NOT
  -- counted here (it lives in the initTrustScore SEED) — the ADR-0017 seam:
  -- restatement must not buy ranking boosts the way an outcome signal does.
  signal_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  superseded_by TEXT REFERENCES observations(id),
  deleted_at INTEGER,
  -- Task 66.3 (design §16.18 / D-258): the declared validity end, epoch ms,
  -- NULL = permanent. Mirrors the committed fact-file expires_at frontmatter
  -- (facts only; scratchpad bullets are always NULL — they age via the 14-day
  -- consolidation drop instead). Search hides expired rows at READ time (the
  -- immediate half of enforcement); the weekly-curate sweep tombstones them
  -- (the durable half).
  expires_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_observations_tier ON observations(tier);
CREATE INDEX IF NOT EXISTS idx_observations_trust ON observations(trust);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at);
CREATE INDEX IF NOT EXISTS idx_observations_deleted ON observations(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
  body, heading_path, write_source,
  content='observations',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

-- FTS5 external-content sync triggers (sqlite.org/fts5 §4.4.3).
-- The standard "DELETE FROM fts WHERE rowid = old.rowid" trigger pattern
-- does NOT work for external-content FTS5 (content='observations') —
-- FTS5 needs to read the deleted content to remove it from the index,
-- but the row is gone by the time an AFTER DELETE trigger runs. The
-- documented escape hatch is the 'delete' / 'delete-all' command — a
-- sentinel INSERT into the FTS5 table that takes rowid + column values
-- so FTS5 can compute the delete without re-reading the source row.
CREATE TRIGGER IF NOT EXISTS obs_after_insert AFTER INSERT ON observations BEGIN
  INSERT INTO observations_fts(rowid, body, heading_path, write_source)
  VALUES (new.rowid, new.body, new.heading_path, new.write_source);
END;

CREATE TRIGGER IF NOT EXISTS obs_after_update AFTER UPDATE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, body, heading_path, write_source)
  VALUES ('delete', old.rowid, old.body, old.heading_path, old.write_source);
  INSERT INTO observations_fts(rowid, body, heading_path, write_source)
  VALUES (new.rowid, new.body, new.heading_path, new.write_source);
END;

CREATE TRIGGER IF NOT EXISTS obs_after_delete AFTER DELETE ON observations BEGIN
  INSERT INTO observations_fts(observations_fts, rowid, body, heading_path, write_source)
  VALUES ('delete', old.rowid, old.body, old.heading_path, old.write_source);
END;

CREATE TABLE IF NOT EXISTS files (
  path TEXT PRIMARY KEY,
  mtime INTEGER NOT NULL,
  sha1 TEXT NOT NULL,
  indexed_at INTEGER NOT NULL
);

-- Task 104.2 — the L3 raw tier (D-117). Transcript turn-chunks live in a
-- SEPARATE table + FTS so the raw tier is searched only when explicitly
-- asked (search --scope transcripts, the MemPalace last-resort contract)
-- and never pollutes L1 fact results. Chunks have no id/tier/trust — the
-- drill-back key is source_file:source_line. IF NOT EXISTS means existing
-- DBs gain these tables on the first open after upgrade (no migration).
CREATE TABLE IF NOT EXISTS transcript_chunks (
  source_file TEXT NOT NULL,
  chunk_idx INTEGER NOT NULL,
  source_line INTEGER NOT NULL,
  heading TEXT,
  body TEXT NOT NULL,
  PRIMARY KEY (source_file, chunk_idx)
);

CREATE VIRTUAL TABLE IF NOT EXISTS transcript_chunks_fts USING fts5(
  body, heading,
  content='transcript_chunks',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS tch_after_insert AFTER INSERT ON transcript_chunks BEGIN
  INSERT INTO transcript_chunks_fts(rowid, body, heading)
  VALUES (new.rowid, new.body, new.heading);
END;

CREATE TRIGGER IF NOT EXISTS tch_after_update AFTER UPDATE ON transcript_chunks BEGIN
  INSERT INTO transcript_chunks_fts(transcript_chunks_fts, rowid, body, heading)
  VALUES ('delete', old.rowid, old.body, old.heading);
  INSERT INTO transcript_chunks_fts(rowid, body, heading)
  VALUES (new.rowid, new.body, new.heading);
END;

CREATE TRIGGER IF NOT EXISTS tch_after_delete AFTER DELETE ON transcript_chunks BEGIN
  INSERT INTO transcript_chunks_fts(transcript_chunks_fts, rowid, body, heading)
  VALUES ('delete', old.rowid, old.body, old.heading);
END;

-- Task 232 (ADR-0023 ACTIVATE slice / D-392) — the relational adjacency axis.
-- The kit already WRITES two edge kinds it never traversed: related:
-- frontmatter (+ [[slug]] body wikilinks) and the superseded_by FK. This
-- table ACTIVATES them: a plain (src, dst, type) edge list, rebuilt from the
-- markdown at reindex EXACTLY like the FTS mirror (ADR-0002 — markdown stays
-- the only source of truth; the table drops + rebuilds byte-stable). Populated
-- by graph-index.mjs::rebuildEdges, never written directly by a mutating op.
--
--   src          — the SOURCE fact id (always a kit id [PUL]-XXXXXXXX); the
--                  fact whose frontmatter/body carries the reference.
--   dst          — the TARGET. For superseded_by it is the successor's id.
--                  For related/link it is the referenced fact's id when the
--                  slug resolves to a known fact, else the raw slug (a dangling
--                  link the model wrote before/without the target existing).
--   type         — 'related' (frontmatter) | 'link' ([[slug]] body wikilink) |
--                  'superseded_by' (the supersession FK) | 'cites' (Task 256 —
--                  a body anchor citation: fact -> an anchor: hub node
--                  (anchor:D-361 / anchor:Task-232 / anchor:ADR-0023 /
--                  anchor:FR-13 / anchor:NFR-9, a non-file node) OR fact -> a
--                  cited fact id.
--   dst_resolved — 1 when dst is a real kit id (backlink-answerable), 0 when dst
--                  is an unresolved slug OR a non-file anchor: node. Lets a
--                  backlink-by-id query (dst_resolved = 1) ignore danglers +
--                  anchors without dropping them from the graph.
--
-- No FTS mirror, no triggers: edges are structural metadata, not searchable
-- text. Rebuilt wholesale (not incrementally) so cross-file slug→id resolution
-- is always consistent — a new fact can resolve a previously-dangling link.
CREATE TABLE IF NOT EXISTS edges (
  src TEXT NOT NULL,
  dst TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('related', 'link', 'superseded_by', 'cites')),
  dst_resolved INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (src, dst, type)
);

CREATE INDEX IF NOT EXISTS idx_edges_dst ON edges(dst);
CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(type);

-- Task 232: a tiny single-writer key/value sidecar for index-build state that
-- can't be inferred from row emptiness. The edges rebuild writes a sentinel key
-- here AFTER a successful rebuild, so the boot path distinguishes "edges never
-- built" (pre-232 index → migrate once) from "built, legitimately empty" (a
-- corpus whose facts simply carry no links → never re-walk). Without it, an
-- empty edges table on a link-free corpus reads as "never built" on EVERY boot
-- and re-walks the whole corpus before every read.
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT
);
`;

/**
 * @param {string} projectRoot
 * @returns {string} absolute path to the kit's index DB for the given project
 */
export function getIndexDbPath(projectRoot) {
  return join(projectRoot, ...INDEX_DB_RELATIVE);
}

/**
 * Opens (or creates) the index DB for the given project, applies the
 * schema, and sets the documented PRAGMA posture. Idempotent — calling
 * twice against the same projectRoot returns a second handle to the
 * same on-disk database; the schema CREATE IF NOT EXISTS statements
 * are no-ops on the second call.
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} [opts.dbPath]  override path (test fixture injection)
 * @returns {import('better-sqlite3').Database}
 */
export function openIndexDb({ projectRoot, dbPath } = {}) {
  const path = dbPath ?? getIndexDbPath(projectRoot);
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  try {
    return configureIndexDb(db);
  } catch (err) {
    // A corrupt/non-sqlite file at `path` opens fine but throws on the first
    // pragma/exec ("file is not a database"). Close the handle before
    // rethrowing — otherwise the open fd leaks (on Windows it also locks the
    // file, so a caller that fails open can never clean the dir). The read
    // callers already catch + degrade; they must not also leak.
    try {
      db.close();
    } catch {
      /* best-effort */
    }
    throw err;
  }
}

// Apply the documented pragma posture + schema + non-destructive migrations to
// an open handle. Separated so openIndexDb can close-on-throw around it.
function configureIndexDb(db) {
  // WAL + NORMAL synchronous: design §9.1 posture. WAL allows many
  // readers + one writer concurrently; NORMAL trades a small durability
  // window (between WAL checkpoints) for write throughput, acceptable
  // for a regenerable read-cache.
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  // Task 219 (design §16.34, D-321): bounded wait under writer contention —
  // concurrent writers (Stop-hook auto-extract + lazy-compress child + reindex
  // + MCP server) wait up to 5s for the lock instead of throwing SQLITE_BUSY.
  // PREMISE CORRECTION: better-sqlite3 ALREADY defaults its `timeout` option
  // to 5000ms (§16.34 assumed SQLite's raw 0ms default), so this pragma pins
  // an existing behavior as an explicit contract — guarded by the §16.35
  // cross-process test — rather than leaving it to a driver default a future
  // major (or a `timeout: 0` option) could silently change.
  db.pragma('busy_timeout = 5000');
  // Task 261 (D-422) — FK enforcement OFF, deliberately, on the DERIVED cache.
  //
  // better-sqlite3 turns `foreign_keys` ON by default (raw SQLite defaults it
  // off), and this schema's one foreign key is
  // `observations.superseded_by REFERENCES observations(id)`. The indexer
  // inserts ONE SOURCE FILE per transaction, so a fact whose `superseded_by`
  // points at a fact walked LATER violates the constraint at insert time and
  // the whole reindex aborts with an unhandled SqliteError — leaving the index
  // half-built, on BOTH the full and the incremental path.
  //
  // Two legal corpus shapes hit it, and neither is a user error:
  //   - a FORWARD reference — pure walk order, decided by filename sort;
  //   - a DANGLING reference — the successor was later forgotten, so the
  //     markdown legitimately points at a fact that no longer has a row.
  //
  // The constraint was also buying nothing. Referential integrity here is owned
  // by the MARKDOWN (ADR-0002: the index is rebuildable derived state, the files
  // are the source of truth), the FK has no ON DELETE action, and every reader
  // already handles an unresolvable target — graph-index marks it
  // `dst_resolved = 0`, and `cmk get` prints the id as written. So its only
  // observable effect was converting a legitimate corpus into a crash of
  // `cmk reindex --full`, the command the docs prescribe as the repair.
  //
  // Found by the Task 261 aged-corpus harness on its first real run. It had
  // never fired in the dogfood repo for one reason: that corpus happens to have
  // ZERO supersessions, so the question had never been asked.
  db.pragma('foreign_keys = OFF');
  // Task 256: the edges CHECK constraint gained 'cites'. CREATE TABLE IF NOT
  // EXISTS does NOT alter an existing table's CHECK, so a pre-256 index would
  // reject `cites` inserts. edges is a fully rebuildable structural table (drop
  // + rebuild from markdown every reindex — ADR-0002), so dropping a stale one
  // BEFORE the schema runs loses nothing: the schema below recreates it (+ its
  // indexes) with the new constraint, and the sentinel is cleared so the next
  // read's cold-edge path repopulates it. No-op on a fresh or already-current DB.
  migrateEdgesSchema(db);
  // Apply schema (idempotent CREATE IF NOT EXISTS).
  db.exec(INDEX_DB_SCHEMA);
  // Task 151.6: non-destructive column migration. CREATE TABLE IF NOT EXISTS does
  // NOT add a new column to a pre-existing table, so an index built before 151.6
  // would lack `trust_score`. Add it in place (ALTER preserves all rows — the
  // index is rebuildable, but we don't force a full rebuild just for a column).
  // The next full reindex reseeds real values; until then existing rows carry the
  // DEFAULT 0.5 (medium). Idempotent: skip if the column already exists.
  migrateAddColumn(db, 'observations', 'trust_score', 'REAL NOT NULL DEFAULT 0.5');
  // Task 66.3: same non-destructive migration pattern for `expires_at`
  // (nullable — NULL = permanent, which is exactly right for every pre-66 row;
  // the next full reindex populates real values from fact frontmatter).
  migrateAddColumn(db, 'observations', 'expires_at', 'INTEGER');
  // Task 194: same pattern for the feedback counter (see the schema comment).
  // Pre-194 rows start at 0 = "no outcome evidence" — exactly the honest state.
  migrateAddColumn(db, 'observations', 'signal_count', 'INTEGER NOT NULL DEFAULT 0');
  return db;
}

// Task 256: drop a pre-256 `edges` table whose CHECK constraint lacks 'cites' so
// the schema below recreates it with the current constraint (+ its indexes). The
// stored table DDL is read from sqlite_master; a table whose SQL already names
// 'cites' is current → no-op. Clearing the `edges_built_at` sentinel forces the
// next reindex's cold-edge path to repopulate the freshly-empty table (without
// it, `edgesBuilt()` would report "built" over 0 rows). Runs BEFORE db.exec of
// the schema, so the CREATE TABLE IF NOT EXISTS re-adds the table + indexes.
function migrateEdgesSchema(db) {
  let row;
  try {
    row = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'edges'").get();
  } catch {
    return; // no sqlite_master access on a brand-new handle → schema will create it
  }
  if (!row || typeof row.sql !== 'string') return; // edges table not present yet
  if (row.sql.includes("'cites'")) return; // already current
  db.exec('DROP TABLE IF EXISTS edges');
  try {
    db.exec("DELETE FROM meta WHERE key = 'edges_built_at'");
  } catch {
    // meta table may not exist on a very old index; the cold-edge path handles that
  }
}

// Add `column` to `table` if it isn't already present (idempotent). SQLite has no
// "ADD COLUMN IF NOT EXISTS", so we check PRAGMA table_info first — a duplicate
// ALTER would throw.
function migrateAddColumn(db, table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}
