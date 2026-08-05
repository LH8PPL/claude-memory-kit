// @doors: 1, 2
// Door 2: the check is READ-ONLY over the index — the over-mutation guard below
//   pins that a doctor run leaves every vec row and map entry byte-unchanged.
// Door 3 N/A: no subprocess, and deliberately no embedder — HC-15 must be cheap
//   enough to run on every `cmk doctor`, so it loads no model.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: doctor reports through its result object, not an NDJSON log.

// Tests for Task 261 (D-421) — HC-15, the doctor's audit of the semantic index.
//
// WHY THIS CHECK EXISTS: a vec-mapping desync is invisible by construction.
// Search keeps working, results keep scoring 0.85+, nothing errors — the facts
// are simply the wrong ones. The pre-261 bug had 86.7% of the dogfood corpus
// holding an unrelated fact's embedding while the whole suite was green, and it
// was found by a human spot-checking neighbours, not by any gate. Every other
// check in the doctor probes CONFIGURATION or FRESHNESS; this one probes whether
// the data means what it says.
//
// The audit is deliberately independent of the kit's own bookkeeping: it
// re-derives sha256(model\nbody) from the fact's body and byte-compares the
// content-addressed cache entry against what is physically in the vec slot.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { runDoctor } from '../packages/cli/src/doctor.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import {
  syncSemanticIndex,
  loadSqliteVec,
} from '../packages/cli/src/semantic-backend.mjs';

const MODEL = 'test-fake-embedder';
const DIMS = 8;

function fakeVector(text) {
  const h = createHash('sha256').update(String(text), 'utf8').digest();
  const v = [];
  for (let i = 0; i < DIMS; i++) v.push((h[i] + 1) / 256);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  return v.map((x) => x / norm);
}
const fakeExtractor = async (input) => {
  const texts = Array.isArray(input) ? input : [input];
  return { tolist: () => texts.map(fakeVector) };
};

const BODIES = [
  'Never overwrite backup directories during a restore run.',
  'Valkey is the caching layer for hot reads with a 5ms p99 SLA.',
  'Deploys go through GitHub Actions to Fly.io on merge to main.',
  'The snapshot builder must not import the sqlite index module.',
];

let sandbox;
let projectRoot;
let userDir;

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-hc15-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  mkdirSync(projectRoot, { recursive: true });
  await install({ projectRoot, userTier: userDir, noHooks: true });
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

const doctor = () =>
  runDoctor({
    projectRoot,
    userDir,
    now: '2026-08-04T12:00:00Z',
    registryFetcher: async () => null,
    vectorSample: 100,
  });
const hc15 = async () => (await doctor()).checks.find((c) => c.id === 'HC-15');

/** Seed a synced semantic index and hand back the open handle. */
async function seedSemanticIndex() {
  const db = openIndexDb({ projectRoot });
  await loadSqliteVec(db);
  const ins = db.prepare(
    `INSERT INTO observations (id, tier, source_file, source_line, source_sha1,
       heading_path, body, write_source, trust, created_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ234567';
  BODIES.forEach((body, i) => {
    ins.run(
      `P-HC${A[i]}${A[i + 1]}${A[i + 2]}${A[i + 3]}${A[i + 4]}${A[i + 5]}`,
      'P',
      'context/MEMORY.md',
      i + 1,
      'a'.repeat(40),
      null,
      body,
      'user-explicit',
      'high',
      Math.floor(Date.parse('2026-05-15T00:00:00Z') / 1000),
      null,
    );
  });
  const s = await syncSemanticIndex({ db, modelId: MODEL, dims: DIMS, extractorImpl: fakeExtractor });
  expect(s.ok).toBe(true);
  return db;
}

describe('HC-15 — semantic vectors match their own facts', () => {
  it('SKIPs on a project that never used semantic search — never a false FAIL', async () => {
    const c = await hc15();
    expect(c.status).toBe('skip');
    expect(c.message).toMatch(/no search index yet|not in use/);
  });

  it('PASSes on a healthy synced index, naming how many facts it verified', async () => {
    const db = await seedSemanticIndex();
    db.close();
    const c = await hc15();
    expect(c.status).toBe('pass');
    expect(c.message).toContain(`${BODIES.length} sampled fact(s) verified`);
    expect(c.recoveryCommand).toBeUndefined();
  });

  it('FAILs with a count and a working repair when slots hold foreign vectors', async () => {
    const db = await seedSemanticIndex();
    // Swap two facts' vectors — the exact shape D-421 produced 2,012 times.
    const [a, b] = db
      .prepare("SELECT key1, vec_rowid FROM vec_map WHERE scope = 'facts' ORDER BY vec_rowid LIMIT 2")
      .all();
    const get = (r) => db.prepare('SELECT embedding FROM vec_observations WHERE rowid = ?').get(BigInt(r)).embedding;
    const va = get(a.vec_rowid);
    const vb = get(b.vec_rowid);
    const del = db.prepare('DELETE FROM vec_observations WHERE rowid = ?');
    const put = db.prepare('INSERT INTO vec_observations(rowid, embedding) VALUES (?, ?)');
    del.run(BigInt(a.vec_rowid));
    del.run(BigInt(b.vec_rowid));
    put.run(BigInt(a.vec_rowid), vb);
    put.run(BigInt(b.vec_rowid), va);
    db.close();

    const c = await hc15();
    expect(c.status).toBe('fail');
    expect(c.message).toContain(`2 of ${BODIES.length} sampled facts hold the WRONG vector`);
    expect(c.message).toContain(a.key1);
    expect(c.recoveryCommand).toBe('cmk reindex --full');

    // The prescribed repair must actually repair (the D-421 indictment was that
    // it did the opposite): reindex clears the keying marker, the next sync
    // rebuilds the vec layer, and the check goes green.
    const { reindexFull } = await import('../packages/cli/src/index-rebuild.mjs');
    const db2 = openIndexDb({ projectRoot });
    await loadSqliteVec(db2);
    reindexFull({ projectRoot, userDir, db: db2 });
    await syncSemanticIndex({ db: db2, modelId: MODEL, dims: DIMS, extractorImpl: fakeExtractor });
    db2.close();
    const after = await hc15();
    expect(after.status).not.toBe('fail');
  });

  it('is READ-ONLY: a doctor run leaves every vec row and map entry byte-identical', async () => {
    const db = await seedSemanticIndex();
    const snapshot = () => ({
      map: db.prepare('SELECT scope, key1, key2, vec_rowid, content_sha FROM vec_map ORDER BY vec_rowid').all(),
      vec: db
        .prepare('SELECT rowid, embedding FROM vec_observations ORDER BY rowid')
        .all()
        .map((r) => ({ rowid: r.rowid, hex: Buffer.from(r.embedding).toString('hex') })),
      cache: db.prepare('SELECT COUNT(*) AS n FROM embedding_cache').get().n,
    });
    const before = snapshot();
    db.close();

    const c = await hc15();
    expect(c.status).toBe('pass');

    const db2 = openIndexDb({ projectRoot });
    await loadSqliteVec(db2);
    const after = {
      map: db2.prepare('SELECT scope, key1, key2, vec_rowid, content_sha FROM vec_map ORDER BY vec_rowid').all(),
      vec: db2
        .prepare('SELECT rowid, embedding FROM vec_observations ORDER BY rowid')
        .all()
        .map((r) => ({ rowid: r.rowid, hex: Buffer.from(r.embedding).toString('hex') })),
      cache: db2.prepare('SELECT COUNT(*) AS n FROM embedding_cache').get().n,
    };
    db2.close();
    expect(after).toEqual(before);
  });
});
