// @doors: 1, 2
// Door 3 N/A: the embedder runs IN-PROCESS (ONNX via transformers.js, faked
//   here through the extractorImpl DI seam) — this module spawns no subprocess.
// Door 4 N/A: no message-queue surface in the kit.
// Door 5 N/A: semantic-backend.mjs emits no NDJSON log of its own; the vec
//   mapping's observable surface is the returned result rows (Door 1) + the
//   vec/map/cache tables (Door 2), both asserted here. The doctor-facing
//   observability of a desync (HC-15) is asserted in cli-doctor.test.js.
//
// Task 261 / D-421 — THE VEC-ROWID CORRUPTION REGRESSION.
//
// The bug: `vec_observations` was keyed by `observations.rowid`; `reindexFull`
// reassigns every rowid (it DROPs + recreates `observations`) but never dropped
// the vec table, and the sync's skip guard (`present && plan.cached → continue`)
// then read the stale foreign vector as correct. Result on the real dogfood
// corpus: 2,012 of 2,321 live facts (86.7%) held an UNRELATED fact's embedding, and
// `cmk search --mode semantic` returned five facts none of which matched the
// query. `cmk reindex --full` — the documented repair — was the CAUSE.
//
// Why every pre-261 test missed it: a FRESH index assigns rowids 1..N in insert
// order, so the vectors line up perfectly. The corruption only appears on a
// rebuild over an EXISTING index — which no test performed, and which is exactly
// how a real corpus evolves. Unit-green ≠ works-on-real-input.
//
// The invariant these tests pin (implementation-independent, so it survives the
// keying change): for EVERY live observation, querying with that observation's
// own body must return that observation as the top hit at distance ~0. If a
// fact's slot holds another fact's vector, that assertion fails by construction.
// The state-door half asserts the same thing directly at the table level via
// `verifyVectorMapping` (the engine behind HC-15).

import { describe, it, expect, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  syncSemanticIndex,
  prepareSemanticBackend,
  verifyVectorMapping,
  loadSqliteVec,
  ensureSemanticSchema,
  VEC_MAP_VERSION,
} from '../packages/cli/src/semantic-backend.mjs';
import { INDEX_DB_SCHEMA } from '../packages/cli/src/index-db.mjs';

const MODEL = 'test-fake-embedder';
const DIMS = 8;

// A deterministic, content-addressed fake embedder: distinct text → distinct
// (normalized) vector, identical text → byte-identical vector. That mirrors the
// real embedder's only property this test depends on, with zero model weight.
function fakeVector(text) {
  const h = createHash('sha256').update(String(text), 'utf8').digest();
  const v = [];
  for (let i = 0; i < DIMS; i++) v.push((h[i] + 1) / 256);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map((x) => x / norm);
}

function makeFakeExtractor() {
  const calls = [];
  const fn = async (input) => {
    const texts = Array.isArray(input) ? input : [input];
    calls.push(texts.length);
    return { tolist: () => texts.map(fakeVector) };
  };
  fn.calls = calls;
  fn.embedCount = () => calls.reduce((a, b) => a + b, 0);
  return fn;
}

// base32 alphabet the kit's ID_PATTERN allows (no 0/O/1/l/I/8).
const A = 'ABCDEFGHJKMNPQRSTUVWXYZ234567';
function testId(n) {
  let s = '';
  let x = n;
  for (let k = 0; k < 8; k++) {
    s = A[x % A.length] + s;
    x = Math.floor(x / A.length);
  }
  return `P-${s}`;
}

const FACTS = [
  { id: testId(11), body: 'Never overwrite backup directories during a restore run.' },
  { id: testId(12), body: 'Valkey is the caching layer for hot reads with a 5ms p99 SLA.' },
  { id: testId(13), body: 'Deploys go through GitHub Actions to Fly.io on merge to main.' },
  { id: testId(14), body: 'The snapshot builder must not import the sqlite index module.' },
  { id: testId(15), body: 'Release notes are generated from the CHANGELOG, never hand-written.' },
  { id: testId(16), body: 'Tombstones live under context/memory/tombstones and are never deleted.' },
];

function insertObservations(db, facts) {
  const ins = db.prepare(
    `INSERT INTO observations (id, tier, source_file, source_line, source_sha1,
       heading_path, body, write_source, trust, created_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  facts.forEach((f, i) =>
    ins.run(
      f.id,
      'P',
      f.source_file ?? 'context/MEMORY.md',
      i + 1,
      'a'.repeat(40),
      null,
      f.body,
      'user-explicit',
      'high',
      Math.floor(Date.parse('2026-05-15T00:00:00Z') / 1000),
      null,
    ),
  );
}

function makeDb(facts = FACTS) {
  const db = new Database(':memory:');
  db.exec(INDEX_DB_SCHEMA);
  insertObservations(db, facts);
  return db;
}

/**
 * THE INVARIANT, asserted through the public boundary only.
 *
 * For every live observation, a semantic query using that observation's exact
 * body must come back with that observation at rank 1 and similarity ~1 (the
 * fake embedder is content-addressed, so an exact body match is distance 0).
 * A slot holding a foreign vector breaks this for at least two facts.
 */
async function expectEveryFactRecallsItself(db, facts) {
  const wrong = [];
  for (const f of facts) {
    const prep = await prepareSemanticBackend({
      db,
      query: f.body,
      modelId: MODEL,
      dims: DIMS,
      extractorImpl: makeFakeExtractor(),
    });
    expect(prep.ok).toBe(true);
    const hits = prep.backend({ limit: 3 });
    const top = hits[0];
    if (!top || top.id !== f.id || top.score < 0.999) {
      wrong.push({
        queriedFact: f.id,
        queriedBody: f.body.slice(0, 48),
        gotId: top?.id ?? '(no hit)',
        gotSnippet: (top?.snippet ?? '').slice(0, 48),
        gotScore: top?.score ?? null,
      });
    }
  }
  expect(wrong).toEqual([]);
}

let sandboxes = [];
afterEach(() => {
  for (const s of sandboxes) {
    try {
      rmSync(s, { recursive: true, force: true });
    } catch {
      /* best-effort */
    }
  }
  sandboxes = [];
});

describe('Task 261 — the vec index stays mapped to its own facts across rebuilds', () => {
  it('a FRESH index recalls every fact by its own body (the pre-261 green baseline)', async () => {
    const db = makeDb();
    if (!(await loadSqliteVec(db))) {
      db.close();
      throw new Error('sqlite-vec is a regular dependency and must load');
    }
    try {
      await expectEveryFactRecallsItself(db, FACTS);
    } finally {
      db.close();
    }
  });

  it('RED (D-421): rowids reassigned by a rebuild must not leave facts holding foreign vectors', async () => {
    const db = makeDb();
    if (!(await loadSqliteVec(db))) {
      db.close();
      throw new Error('sqlite-vec is a regular dependency and must load');
    }
    try {
      // Sync #1 — the healthy fresh index.
      const s1 = await syncSemanticIndex({
        db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor(),
      });
      expect(s1.ok).toBe(true);
      expect(s1.embedded).toBe(FACTS.length);

      // The real-world mutation, in miniature: `reindexFull` DROPs and rebuilds
      // `observations`, so every rowid is reassigned. Deleting + re-inserting in
      // a different order reproduces exactly that (SQLite restarts rowids at 1
      // once the table is empty), with none of the markdown machinery.
      db.prepare('DELETE FROM observations').run();
      insertObservations(db, [...FACTS].reverse());

      // Sync #2 — nothing to embed (the content-addressed cache is intact), and
      // the vec table must end up mapped to the NEW rowids, not the old ones.
      const fake2 = makeFakeExtractor();
      const s2 = await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: fake2 });
      expect(s2.ok).toBe(true);
      // No RESET on an ordinary re-sync — the stable key made the rebuild a
      // no-op, which is the whole point of keying by the fact's own id.
      expect(s2.reset).toBe(false);
      // Re-population after a rebuild is FREE: the cache is content-addressed,
      // so zero model calls (Task 261's cost claim, asserted rather than trusted).
      expect(s2.embedded).toBe(0);
      expect(fake2.embedCount()).toBe(0);

      await expectEveryFactRecallsItself(db, FACTS);
    } finally {
      db.close();
    }
  });

  it('RED (D-421): a body edited to text ALREADY in the cache must refresh its vector', async () => {
    // The sibling of the same unsound guard: `present && plan.cached → continue`
    // treats "this content is cached" as "this slot holds this content", which
    // is false when a body changes to text some other fact already embedded.
    const db = makeDb();
    if (!(await loadSqliteVec(db))) {
      db.close();
      throw new Error('sqlite-vec is a regular dependency and must load');
    }
    try {
      await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor() });
      // FACTS[0] is reworded to FACTS[1]'s body — whose sha is already cached.
      const newBody = FACTS[1].body;
      db.prepare('UPDATE observations SET body = ? WHERE id = ?').run(newBody, FACTS[0].id);
      const fake2 = makeFakeExtractor();
      const s2 = await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: fake2 });
      expect(s2.ok).toBe(true);
      expect(fake2.embedCount()).toBe(0); // cached — no model call needed

      // Both facts now carry the same body, so the query must return one of
      // them at similarity ~1 — and the EDITED fact must be reachable at all.
      const prep = await prepareSemanticBackend({
        db, query: newBody, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor(),
      });
      expect(prep.ok).toBe(true);
      const hits = prep.backend({ limit: 6 });
      const exact = hits.filter((h) => h.score > 0.999).map((h) => h.id).sort();
      expect(exact).toEqual([FACTS[0].id, FACTS[1].id].sort());
    } finally {
      db.close();
    }
  });

  it('over-mutation guard: forgetting one fact leaves the other N-1 correctly mapped', async () => {
    const db = makeDb();
    if (!(await loadSqliteVec(db))) {
      db.close();
      throw new Error('sqlite-vec is a regular dependency and must load');
    }
    try {
      await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor() });
      db.prepare('UPDATE observations SET deleted_at = 1 WHERE id = ?').run(FACTS[2].id);
      const s2 = await syncSemanticIndex({
        db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor(),
      });
      expect(s2.ok).toBe(true);
      expect(s2.dropped).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS n FROM vec_observations').get().n).toBe(FACTS.length - 1);
      // The survivors are untouched AND still their own.
      await expectEveryFactRecallsItself(db, FACTS.filter((f) => f.id !== FACTS[2].id));
      // The tombstoned fact never surfaces.
      const prep = await prepareSemanticBackend({
        db, query: FACTS[2].body, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor(),
      });
      expect(prep.backend({ limit: 6 }).map((h) => h.id)).not.toContain(FACTS[2].id);
    } finally {
      db.close();
    }
  });
});

describe('Task 261 — verifyVectorMapping, the detection half (Door 2: the tables themselves)', () => {
  it('reports every slot verified on a healthy index, and no vectors are unverifiable', async () => {
    const db = makeDb();
    await loadSqliteVec(db);
    try {
      await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor() });
      const v = await verifyVectorMapping({ db, modelId: MODEL, sample: 100 });
      expect(v).toMatchObject({ ok: true, checked: FACTS.length, unverifiable: 0 });
      expect(v.mismatches).toEqual([]);
    } finally {
      db.close();
    }
  });

  it('DETECTS a hand-corrupted slot — the guard that makes this non-silent', async () => {
    const db = makeDb();
    await loadSqliteVec(db);
    try {
      await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor() });
      // Swap two facts' vectors behind the sync's back — precisely the state
      // D-421 produced 360 times on the real corpus.
      const [a, b] = db
        .prepare("SELECT key1, vec_rowid FROM vec_map WHERE scope = 'facts' ORDER BY vec_rowid LIMIT 2")
        .all();
      const va = db.prepare('SELECT embedding FROM vec_observations WHERE rowid = ?').get(BigInt(a.vec_rowid)).embedding;
      const vb = db.prepare('SELECT embedding FROM vec_observations WHERE rowid = ?').get(BigInt(b.vec_rowid)).embedding;
      db.prepare('DELETE FROM vec_observations WHERE rowid = ?').run(BigInt(a.vec_rowid));
      db.prepare('DELETE FROM vec_observations WHERE rowid = ?').run(BigInt(b.vec_rowid));
      db.prepare('INSERT INTO vec_observations(rowid, embedding) VALUES (?, ?)').run(BigInt(a.vec_rowid), vb);
      db.prepare('INSERT INTO vec_observations(rowid, embedding) VALUES (?, ?)').run(BigInt(b.vec_rowid), va);

      const v = await verifyVectorMapping({ db, modelId: MODEL, sample: 100 });
      expect(v.ok).toBe(false);
      expect(v.mismatches).toHaveLength(2);
      expect(v.mismatches.map((m) => m.reason)).toEqual(['foreign-vector', 'foreign-vector']);
      expect(v.mismatches.map((m) => m.key1).sort()).toEqual([a.key1, b.key1].sort());
    } finally {
      db.close();
    }
  });

  it('an index with no semantic layer is `semantic-index-absent`, never a false FAIL', async () => {
    const db = makeDb();
    try {
      const v = await verifyVectorMapping({ db, modelId: MODEL });
      expect(v).toMatchObject({ ok: false, reason: 'semantic-index-absent', checked: 0 });
    } finally {
      db.close();
    }
  });
});

describe('Task 261 — an ALREADY-CORRUPTED install heals itself (the D-421 repair path)', () => {
  it('a pre-261 index (vec rows keyed by observations.rowid) is reset on the next sync, for free', async () => {
    const db = makeDb();
    await loadSqliteVec(db);
    try {
      // Reconstruct the pre-261 on-disk state by hand: vec rows filed under the
      // CONTENT table's rowid, no vec_map, no map_version marker — plus the
      // rowid shuffle a rebuild caused. This is what every existing install's
      // index looks like right now.
      ensureSemanticSchema(db, { dims: DIMS });
      const cachePut = db.prepare(
        'INSERT OR REPLACE INTO embedding_cache(content_sha, model, vector) VALUES (?, ?, ?)',
      );
      const toBlob = (v) => Buffer.from(new Float32Array(v).buffer);
      FACTS.forEach((f, i) => {
        cachePut.run(
          createHash('sha256').update(`${MODEL}\n${f.body}`, 'utf8').digest('hex'),
          MODEL,
          toBlob(fakeVector(f.body)),
        );
        // The off-by-one shuffle: fact i's slot holds fact i+1's vector.
        const foreign = FACTS[(i + 1) % FACTS.length];
        db.prepare('INSERT INTO vec_observations(rowid, embedding) VALUES (?, ?)').run(
          BigInt(i + 1),
          toBlob(fakeVector(foreign.body)),
        );
      });
      db.prepare("INSERT INTO vec_meta(key, value) VALUES ('model', ?)").run(MODEL);
      db.prepare("INSERT INTO vec_meta(key, value) VALUES ('dims', ?)").run(String(DIMS));
      db.exec('DELETE FROM vec_map'); // pre-261: the table did not exist at all
      expect(db.prepare("SELECT COUNT(*) c FROM vec_meta WHERE key = 'map_version'").get().c).toBe(0);

      // The healing sync — no model calls, because every vector is cached.
      const fake = makeFakeExtractor();
      const s = await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: fake });
      expect(s.ok).toBe(true);
      expect(s.reset).toBe(true); // Door 1: the wholesale rebuild is REPORTED, not silent
      expect(fake.embedCount()).toBe(0); // FREE: the content-addressed cache survives
      expect(db.prepare("SELECT value FROM vec_meta WHERE key = 'map_version'").get().value)
        .toBe(VEC_MAP_VERSION);

      const v = await verifyVectorMapping({ db, modelId: MODEL, sample: 100 });
      expect(v).toMatchObject({ ok: true, checked: FACTS.length });
      await expectEveryFactRecallsItself(db, FACTS);
    } finally {
      db.close();
    }
  });

  it('`reindexFull` invalidates the keying marker, so the documented repair repairs', async () => {
    const { openIndexDb } = await import('../packages/cli/src/index-db.mjs');
    const { reindexFull } = await import('../packages/cli/src/index-rebuild.mjs');
    const sandbox = mkdtempSync(join(tmpdir(), 'cmk-261-repair-'));
    sandboxes.push(sandbox);
    const projectRoot = join(sandbox, 'proj');
    mkdirSync(join(projectRoot, 'context'), { recursive: true });
    const db = openIndexDb({ projectRoot });
    try {
      await loadSqliteVec(db);
      ensureSemanticSchema(db, { dims: DIMS });
      db.prepare("INSERT INTO vec_meta(key, value) VALUES ('map_version', ?)").run(VEC_MAP_VERSION);
      reindexFull({ projectRoot, userDir: join(sandbox, 'user'), db });
      // The marker is gone → the next sync rebuilds the vec layer from scratch.
      expect(db.prepare("SELECT COUNT(*) c FROM vec_meta WHERE key = 'map_version'").get().c).toBe(0);
    } finally {
      db.close();
    }
  });
});

describe('Task 261 — the real `reindexFull` over a real project tier (the D-421 reproduction)', () => {
  it('RED (D-421): `cmk reindex --full` must not desync the vec index', async () => {
    const { install } = await import('../packages/cli/src/install.mjs');
    const { openIndexDb } = await import('../packages/cli/src/index-db.mjs');
    const { reindexFull } = await import('../packages/cli/src/index-rebuild.mjs');
    const { writeFact } = await import('../packages/cli/src/write-fact.mjs');

    const sandbox = mkdtempSync(join(tmpdir(), 'cmk-261-'));
    sandboxes.push(sandbox);
    const projectRoot = join(sandbox, 'proj');
    const userDir = join(sandbox, 'user');
    mkdirSync(projectRoot, { recursive: true });
    await install({ projectRoot, userTier: userDir });

    // Real fact files through the real writer.
    const bodies = [
      'Never overwrite backup directories during a restore run.',
      'The caching layer is Valkey with a 5ms p99 read SLA.',
      'Deploys run through GitHub Actions to Fly.io on merge to main.',
      'The snapshot builder must not import the sqlite index module.',
      'Release notes come from the CHANGELOG, never hand-written.',
      'Tombstones live under context/memory/tombstones and are never deleted.',
    ];
    bodies.forEach((body, i) => {
      const w = writeFact({
        projectRoot,
        tier: 'P',
        type: 'project',
        slug: `vecmap-fact-${i}`,
        title: `Fact ${i}`,
        body,
        writeSource: 'user-explicit',
        trust: 'high',
        sourceFile: 'MEMORY.md',
        sourceLine: i + 1,
        sourceSha1: 'a'.repeat(40),
      });
      expect(w.action, JSON.stringify(w)).toBe('created');
    });

    const db = openIndexDb({ projectRoot });
    try {
      if (!(await loadSqliteVec(db))) throw new Error('sqlite-vec must load');
      reindexFull({ projectRoot, userDir, db });
      const live = db
        .prepare('SELECT id, body FROM observations WHERE deleted_at IS NULL AND superseded_by IS NULL')
        .all();
      expect(live.length).toBeGreaterThanOrEqual(bodies.length);

      const s1 = await syncSemanticIndex({
        db, modelId: MODEL, dims: DIMS, extractorImpl: makeFakeExtractor(),
      });
      expect(s1.ok).toBe(true);
      await expectEveryFactRecallsItself(db, live);

      // The corpus EVOLVES, then the user runs the documented repair. This is
      // the honest reproduction: a repeated identical `reindexFull` happens to
      // re-assign the same rowids in the same order, so it alone looks fine —
      // the desync appears once the corpus changed between rebuilds, which is
      // exactly how a real tier lives (facts get written and forgotten).
      rmSync(join(projectRoot, 'context', 'memory', 'project_vecmap-fact-0.md'));
      reindexFull({ projectRoot, userDir, db });
      const fake2 = makeFakeExtractor();
      const s2 = await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: fake2 });
      expect(s2.ok).toBe(true);
      expect(fake2.embedCount()).toBe(0); // free: the cache survives a reindex

      const liveAfter = db
        .prepare('SELECT id, body FROM observations WHERE deleted_at IS NULL AND superseded_by IS NULL')
        .all();
      await expectEveryFactRecallsItself(db, liveAfter);
    } finally {
      db.close();
    }
  }, 120_000);
});
