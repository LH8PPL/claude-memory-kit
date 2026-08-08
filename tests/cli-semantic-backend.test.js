// @doors: 1, 2
// Door 3 N/A: the embedder runs IN-PROCESS (ONNX via transformers.js) — no
//   subprocess is spawned anywhere in this module.
// Door 4 N/A: the backend emits no NDJSON logs; its observable surface is the
//   returned result rows + the db tables asserted here (Door 2). The CLI/MCP
//   error paths (actionable hint on absent embedder) are asserted in
//   cli-search.test.js / cli-mcp-server.test.js.
// Door 5 N/A: no message-queue interaction.
//
// Tests for Task 65 — the embedded semantic backend (semantic-backend.mjs).
// Boundary: ensureSemanticSchema / syncSemanticIndex / prepareSemanticBackend
// / rerankResults / parseTemporalHint. Integration cases use the REAL
// embedder with the SMALL model (Xenova/bge-small-en-v1.5, ~30 MB q8 — the
// test rung; production default is bge-base per the D-109 bake-off) and skip
// gracefully when the optional dep / network is unavailable (the live-Haiku
// skip pattern).

import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import {
  rerankResults,
  parseTemporalHint,
  syncSemanticIndex,
  prepareSemanticBackend,
  loadSqliteVec,
  EMBED_BATCH_SIZE,
  EMBED_BATCH_CHARS,
  planEmbedBatches,
} from '../packages/cli/src/semantic-backend.mjs';
import { INDEX_DB_SCHEMA } from '../packages/cli/src/index-db.mjs';

const TEST_MODEL = 'Xenova/bge-small-en-v1.5';

// Probe the optional embedder once; integration cases skip without it.
let embedderAvailable = process.env.CMK_SKIP_EMBEDDER === '1' ? false : null;
async function probeEmbedder() {
  if (embedderAvailable !== null) return embedderAvailable;
  try {
    await import('@huggingface/transformers');
    embedderAvailable = true;
  } catch {
    embedderAvailable = false;
  }
  return embedderAvailable;
}

function makeDb(rows = []) {
  const db = new Database(':memory:');
  db.exec(INDEX_DB_SCHEMA);
  const ins = db.prepare(
    `INSERT INTO observations (id, tier, source_file, source_line, source_sha1,
       heading_path, body, write_source, trust, created_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  rows.forEach((r, i) =>
    ins.run(
      r.id,
      r.tier ?? 'P',
      r.source_file ?? 'context/MEMORY.md',
      r.source_line ?? i + 1,
      'a'.repeat(40),
      null,
      r.body,
      'user-explicit',
      r.trust ?? 'high',
      r.created_at ?? Math.floor(Date.parse('2026-05-15T00:00:00Z') / 1000),
      r.deleted_at ?? null,
    ),
  );
  return db;
}

const ROWS = [
  { id: 'P-AAAA2222', body: 'Valkey is the caching layer for hot reads, 5ms p99 SLA.' },
  { id: 'P-BBBB3333', body: 'Deploys go through GitHub Actions to Fly.io on merge to main.' },
  {
    id: 'P-CCCC4444',
    body: 'Migrated the primary database to CockroachDB in late May.',
    created_at: Math.floor(Date.parse('2026-05-28T00:00:00Z') / 1000),
  },
];

describe('P-5VJJUEES — syncSemanticIndex embeds in bounded chunks (the 8.8GB leak guard)', () => {
  // A fake extractor recording the size of every forward pass. Returns a
  // trivial 3-dim vector per input text (shape matches transformers.js output:
  // { tolist(): number[][] }). This lets us assert batch sizes WITHOUT the
  // ~110MB model — the leak was a single 471-wide batch, so the contract worth
  // pinning is "never one giant call; always ≤ EMBED_BATCH_SIZE per call".
  function makeSpyExtractor() {
    const batchSizes = [];
    const fn = async (input) => {
      const texts = Array.isArray(input) ? input : [input];
      batchSizes.push(texts.length);
      return { tolist: () => texts.map(() => [0.1, 0.2, 0.3]) };
    };
    fn.batchSizes = batchSizes;
    return fn;
  }

  function seedDb(n) {
    const db = new Database(':memory:');
    db.exec(INDEX_DB_SCHEMA);
    const ins = db.prepare(
      `INSERT INTO observations (id, tier, source_file, source_line, source_sha1,
         heading_path, body, write_source, trust, created_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    // base32 alphabet without 0/O/1/l/I/8 — unique 8-char id body per row.
    const A = 'ABCDEFGHJKMNPQRSTUVWXYZ234567';
    const enc = (num) => {
      let s = '';
      let x = num;
      for (let k = 0; k < 5; k++) { s = A[x % A.length] + s; x = Math.floor(x / A.length); }
      return s;
    };
    for (let i = 0; i < n; i++) {
      ins.run(
        `P-CHK${enc(i)}`,
        'P',
        'context/MEMORY.md',
        i + 1,
        'a'.repeat(40),
        null,
        `fact number ${i} with distinct body text for embedding`,
        'user-explicit',
        'high',
        Math.floor(Date.parse('2026-05-15T00:00:00Z') / 1000),
        null,
      );
    }
    return db;
  }

  it('planEmbedBatches bounds BOTH item-count and total chars (the long-sequence guard)', () => {
    // item-count bound: 40 short texts → ceil(40/EMBED_BATCH_SIZE) batches.
    const shorts = Array.from({ length: 40 }, () => 'short');
    const byCount = planEmbedBatches(shorts);
    expect(Math.max(...byCount.map((b) => b.length))).toBeLessThanOrEqual(EMBED_BATCH_SIZE);
    expect(byCount.flat()).toHaveLength(40); // order + count preserved

    // char-budget bound: one body longer than the char budget must NOT share a
    // batch — it forms its own (this is the 5000-char-fact-freezes-machine case),
    // AND is hard-truncated to the char budget (M1).
    const big = 'x'.repeat(EMBED_BATCH_CHARS + 1000);
    const mixed = ['a', 'b', big, 'c', 'd'];
    const byChars = planEmbedBatches(mixed);
    // every batch respects the char budget (the oversized item is truncated to it).
    for (const batch of byChars) {
      const chars = batch.reduce((s, t) => s + t.length, 0);
      expect(chars).toBeLessThanOrEqual(EMBED_BATCH_CHARS);
    }
    // the (now-truncated) giant body is alone in its batch
    const truncated = big.slice(0, EMBED_BATCH_CHARS);
    const bigBatch = byChars.find((b) => b.includes(truncated));
    expect(bigBatch).toHaveLength(1);
    // order preserved end-to-end (the big item appears truncated in place).
    expect(byChars.flat()).toEqual(['a', 'b', truncated, 'c', 'd']);
  });

  it('embeds 40 uncached bodies in bounded batches, never one giant call', async () => {
    const db = seedDb(40);
    if (!loadSqliteVec(db)) return; // sqlite-vec is a regular dep; if absent, skip
    const spy = makeSpyExtractor();
    // dims=3 to match the spy's vector width (skip the model-derived probe).
    const r = await syncSemanticIndex({ db, modelId: 'test-spy', dims: 3, extractorImpl: spy });
    expect(r.ok).toBe(true);
    expect(r.embedded).toBe(40);
    // The core guard: NO single call embedded all 40 at once.
    expect(Math.max(...spy.batchSizes)).toBeLessThanOrEqual(EMBED_BATCH_SIZE);
    // every text embedded exactly once, order preserved.
    expect(spy.batchSizes.reduce((a, b) => a + b, 0)).toBe(40);
    db.close();
  });

  it('content-addressed cache still holds: a 2nd sync re-embeds nothing (0 extractor calls)', async () => {
    const db = seedDb(40);
    if (!loadSqliteVec(db)) return;
    const spy1 = makeSpyExtractor();
    await syncSemanticIndex({ db, modelId: 'test-spy', dims: 3, extractorImpl: spy1 });
    const spy2 = makeSpyExtractor();
    const r2 = await syncSemanticIndex({ db, modelId: 'test-spy', dims: 3, extractorImpl: spy2 });
    expect(r2.ok).toBe(true);
    expect(r2.embedded).toBe(0); // all cached from sync #1
    expect(spy2.batchSizes.length).toBe(0); // NO forward pass at all
    db.close();
  });

  // Skill-review I1: an extractor that returns FEWER vectors than its input
  // must fail CLOSED (return ok:false), never silently cache desynced vectors.
  it('fails closed on an extractor count mismatch (I1 — durable-cache-corruption guard)', async () => {
    const db = seedDb(10);
    if (!loadSqliteVec(db)) return;
    // a broken extractor that drops one vector per batch
    const broken = async (input) => {
      const texts = Array.isArray(input) ? input : [input];
      return { tolist: () => texts.slice(1).map(() => [0.1, 0.2, 0.3]) }; // one short
    };
    const r = await syncSemanticIndex({ db, modelId: 'test-spy', dims: 3, extractorImpl: broken });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/^embed-count-mismatch:/);
    // State door: NOTHING was written to the vec table (fail before the upsert).
    const vecCount = db.prepare('SELECT COUNT(*) c FROM vec_observations').get().c;
    expect(vecCount).toBe(0);
    db.close();
  });

  // Skill-review M2: empty/whitespace bodies never reach the embedder (NaN
  // vectors) and are excluded from the plans walk (so the mapping stays exact).
  it('skips empty/whitespace bodies — they get no embedding, count stays exact (M2)', async () => {
    const db = new Database(':memory:');
    db.exec(INDEX_DB_SCHEMA);
    const ins = db.prepare(
      `INSERT INTO observations (id, tier, source_file, source_line, source_sha1,
         heading_path, body, write_source, trust, created_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const ts = Math.floor(Date.parse('2026-05-15T00:00:00Z') / 1000);
    // 2 real bodies + 1 empty + 1 whitespace-only
    ins.run('P-REALAAA2', 'P', 'context/MEMORY.md', 1, 'a'.repeat(40), null, 'a real fact body', 'user-explicit', 'high', ts, null);
    ins.run('P-EMPTYAA3', 'P', 'context/MEMORY.md', 2, 'a'.repeat(40), null, '', 'user-explicit', 'high', ts, null);
    ins.run('P-WSPACEA4', 'P', 'context/MEMORY.md', 3, 'a'.repeat(40), null, '   \n  ', 'user-explicit', 'high', ts, null);
    ins.run('P-REALBBB5', 'P', 'context/MEMORY.md', 4, 'a'.repeat(40), null, 'another real fact', 'user-explicit', 'high', ts, null);
    if (!loadSqliteVec(db)) { db.close(); return; }
    const spy = makeSpyExtractor();
    const r = await syncSemanticIndex({ db, modelId: 'test-spy', dims: 3, extractorImpl: spy });
    expect(r.ok).toBe(true);
    expect(r.embedded).toBe(2); // only the 2 real bodies
    expect(spy.batchSizes.reduce((a, b) => a + b, 0)).toBe(2); // never embedded the empties
    db.close();
  });

  // Skill-review M1: a single body longer than the char budget is HARD-TRUNCATED
  // to EMBED_BATCH_CHARS before embedding — one item can't allocate a huge tensor.
  it('hard-truncates a single over-budget body to EMBED_BATCH_CHARS (M1)', () => {
    const huge = 'y'.repeat(EMBED_BATCH_CHARS * 3);
    const batches = planEmbedBatches([huge]);
    expect(batches).toHaveLength(1);
    expect(batches[0]).toHaveLength(1);
    // the embedded text is truncated to the char budget, not the full 3× body.
    expect(batches[0][0].length).toBe(EMBED_BATCH_CHARS);
  });
});

describe('Task 65 — rerank stage (pure, Door 1)', () => {
  it('keyword-overlap boost lifts the result sharing query tokens', () => {
    const results = [
      { id: 'a', snippet: 'totally unrelated text here', score: 0.5 },
      { id: 'b', snippet: 'the caching layer uses valkey', score: 0.5 },
    ];
    const out = rerankResults(results, { query: 'caching layer choice' });
    expect(out[0].id).toBe('b');
  });

  it('temporal boost lifts the date-proximate result when the query carries a hint', () => {
    const now = Date.parse('2026-06-10T00:00:00Z');
    // FIXTURE CORRECTED (Task 264(b)): these were `Date.parse(...) / 1000`,
    // i.e. epoch SECONDS — the same wrong unit the implementation carried, so
    // the two cancelled and this case passed over a broken temporal term. An
    // observation's `created_at` is epoch MS everywhere it is produced
    // (index-rebuild's isoToEpochMs). The assertion is unchanged; only the
    // input now matches the contract the code is tested against.
    const mayTs = Date.parse('2026-05-25T00:00:00Z');
    const aprTs = Date.parse('2026-03-01T00:00:00Z');
    const results = [
      { id: 'old', snippet: 'database choice notes', score: 0.5, created_at: aprTs },
      { id: 'recent', snippet: 'database choice notes', score: 0.5, created_at: mayTs },
    ];
    const out = rerankResults(results, { query: 'what changed in late may', now });
    expect(out[0].id).toBe('recent');
  });

  it('no hint + no overlap → order preserved (stable)', () => {
    const results = [
      { id: 'x', snippet: 'alpha', score: 0.5 },
      { id: 'y', snippet: 'beta', score: 0.5 },
    ];
    const out = rerankResults(results, { query: 'zzz qqq' });
    expect(out.map((r) => r.id)).toEqual(['x', 'y']);
  });

  it('parseTemporalHint: "N weeks ago", month names with early/late, none', () => {
    const now = Date.parse('2026-06-10T00:00:00Z');
    expect(parseTemporalHint('what did we do 2 weeks ago', now)).toBe(
      now - 2 * 604_800_000,
    );
    expect(parseTemporalHint('the late may migration', now)).toBe(Date.UTC(2026, 4, 25));
    // A month AFTER "now" refers to last year.
    expect(parseTemporalHint('the december incident', now)).toBe(Date.UTC(2025, 11, 15));
    expect(parseTemporalHint('no dates here', now)).toBeNull();
  });
});

// Task 264(b): the unit contract of the temporal term, pinned. `created_at`
// on an observation row is ALREADY epoch ms (index-rebuild's isoToEpochMs =
// Date.parse) — the same contract the sibling `semanticRowPassesFilters`
// states at the top of this module. `rerankResults` multiplied it by 1000,
// which pushed every diff ~3 orders past the 45-day window, so the temporal
// boost could never fire on real data. These cases assert the ARITHMETIC, not
// just the order: an order-only assertion passes under both units whenever the
// fixture is written in the same wrong unit as the code (which is exactly how
// the bug survived — see the corrected fixture in the case above).
describe('Task 264(b) — rerank temporal term reads created_at as epoch ms', () => {
  const NOW = Date.parse('2026-06-10T00:00:00Z');
  const QUERY = 'what changed in late may'; // → target Date.UTC(2026, 4, 25)

  function fixture() {
    return [
      // 85 days before the hinted date — outside the 45-day window.
      { id: 'old', snippet: 'database choice notes', score: 0.5, created_at: Date.parse('2026-03-01T00:00:00Z') },
      // Exactly the hinted date — full 0.40 boost.
      { id: 'recent', snippet: 'database choice notes', score: 0.5, created_at: Date.parse('2026-05-25T00:00:00Z') },
    ];
  }

  it('boosts the date-proximate row by the documented 0.40 weight (Door 1)', () => {
    const out = rerankResults(fixture(), { query: QUERY, now: NOW });
    expect(out[0].id).toBe('recent');
    // 0.5 * (1 + 0.40) — the full weight, because diff === 0.
    expect(out[0].score).toBeCloseTo(0.7, 10);
  });

  it('leaves a row outside the temporal window at its input score (Door 1)', () => {
    const out = rerankResults(fixture(), { query: QUERY, now: NOW });
    const old = out.find((r) => r.id === 'old');
    // No keyword overlap either, so the score must be byte-for-byte the input.
    expect(old.score).toBe(0.5);
  });

  it('over-mutation guard: boosting one row leaves every other row and the input array untouched', () => {
    const input = [
      ...fixture(),
      { id: 'nodate', snippet: 'database choice notes', score: 0.5 },
      { id: 'far', snippet: 'database choice notes', score: 0.25, created_at: Date.parse('2025-01-01T00:00:00Z') },
    ];
    const before = input.map((r) => ({ ...r }));
    const out = rerankResults(input, { query: QUERY, now: NOW });

    // Nothing dropped, nothing duplicated.
    expect(out).toHaveLength(4);
    expect(new Set(out.map((r) => r.id))).toEqual(new Set(['old', 'recent', 'nodate', 'far']));
    // Exactly ONE row's score moved.
    const moved = out.filter((r) => r.score !== before.find((b) => b.id === r.id).score);
    expect(moved.map((r) => r.id)).toEqual(['recent']);
    // The caller's array is not mutated in place, and the sort key does not leak.
    expect(input).toEqual(before);
    expect(out.every((r) => !('_i' in r))).toBe(true);
  });
});

describe('Task 65 — sync + query (real embedder, small model; Doors 1+2)', () => {
  it('syncs, caches content-addressed, queries by meaning, excludes tombstones, honors filters', async () => {
    if (!(await probeEmbedder())) {
      console.log('embedder unavailable — integration cases skipped');
      return;
    }
    const db = makeDb([
      ...ROWS,
      {
        id: 'P-DDDD5555',
        body: 'A tombstoned secret note that must never surface.',
        deleted_at: 1,
      },
    ]);
    try {
      // Door 2 — first sync embeds the 3 live rows (tombstone excluded).
      const s1 = await syncSemanticIndex({ db, modelId: TEST_MODEL });
      expect(s1.ok).toBe(true);
      expect(s1.total).toBe(3);
      expect(s1.embedded).toBe(3);
      // Second sync: content-addressed cache → ZERO re-embeds (memweave
      // pattern), nothing dropped (over-mutation guard on the cache).
      const s2 = await syncSemanticIndex({ db, modelId: TEST_MODEL });
      expect(s2.embedded).toBe(0);
      expect(s2.dropped).toBe(0);
      expect(db.prepare('SELECT COUNT(*) AS n FROM embedding_cache').get().n).toBe(3);

      // Door 1 — the seam contract: paraphrase query finds the Valkey row.
      const prep = await prepareSemanticBackend({
        db,
        query: 'what is our key-value store choice',
        modelId: TEST_MODEL,
      });
      expect(prep.ok).toBe(true);
      const hits = prep.backend({ limit: 3 });
      expect(hits[0]).toMatchObject({
        id: 'P-AAAA2222',
        tier: 'P',
        trust: 'high',
        source_file: 'context/MEMORY.md',
      });
      expect(hits[0].score).toBeGreaterThan(0);
      expect(hits[0].score).toBeLessThanOrEqual(1);
      // Tombstone never surfaces.
      expect(hits.map((h) => h.id)).not.toContain('P-DDDD5555');
      // Filters compose: a tier filter that matches nothing → empty.
      expect(prep.backend({ limit: 3, tier: 'U' })).toEqual([]);
    } finally {
      db.close();
    }
  }, 240_000);

  it('model change drops + rebuilds the vec table (different vector space)', async () => {
    if (!(await probeEmbedder())) return;
    const db = makeDb(ROWS);
    try {
      await syncSemanticIndex({ db, modelId: TEST_MODEL });
      const before = db.prepare("SELECT value FROM vec_meta WHERE key = 'model'").get();
      expect(before.value).toBe(TEST_MODEL);
      // Re-sync with the same model: vec rows survive (no spurious rebuild).
      const again = await syncSemanticIndex({ db, modelId: TEST_MODEL });
      expect(again.embedded).toBe(0);
      expect(db.prepare('SELECT COUNT(*) AS n FROM vec_observations').get().n).toBe(3);
    } finally {
      db.close();
    }
  }, 240_000);

  it('deleting an observation drops its vec row on the next sync (§9.2.1 propagation)', async () => {
    if (!(await probeEmbedder())) return;
    const db = makeDb(ROWS);
    try {
      await syncSemanticIndex({ db, modelId: TEST_MODEL });
      db.prepare("UPDATE observations SET deleted_at = 1 WHERE id = 'P-BBBB3333'").run();
      const s = await syncSemanticIndex({ db, modelId: TEST_MODEL });
      expect(s.dropped).toBe(1);
      expect(db.prepare('SELECT COUNT(*) AS n FROM vec_observations').get().n).toBe(2);
      // Over-mutation guard: the other two rows are untouched.
      const prep = await prepareSemanticBackend({
        db,
        query: 'caching layer',
        modelId: TEST_MODEL,
      });
      expect(prep.backend({ limit: 5 }).map((h) => h.id)).toContain('P-AAAA2222');
    } finally {
      db.close();
    }
  }, 240_000);
});

// Task 104.2 — the transcripts scope: vec_transcripts beside vec_observations,
// the SHARED content-addressed embedding cache, synthetic T: ids matching the
// keyword backend's fusion keys.
describe('Task 104.2 — semantic over the transcripts scope (real embedder, small model)', () => {
  it('embeds transcript chunks, recalls by meaning, never leaks into the facts scope', async () => {
    if (!(await probeEmbedder())) return;
    const db = makeDb([]);
    try {
      db.prepare(
        'INSERT INTO transcript_chunks (source_file, chunk_idx, source_line, heading, body) VALUES (?, ?, ?, ?, ?)',
      ).run(
        'context/transcripts/2026-06-10.md', 0, 7,
        '## 2026-06-10T10:00:00Z — assistant',
        'We fixed the login failure by rotating the expired API credential.',
      );
      db.prepare(
        'INSERT INTO transcript_chunks (source_file, chunk_idx, source_line, heading, body) VALUES (?, ?, ?, ?, ?)',
      ).run(
        'context/transcripts/2026-06-09.md', 0, 3,
        '## 2026-06-09T09:00:00Z — assistant',
        'Refactored the CSS grid layout for the dashboard.',
      );

      const prep = await prepareSemanticBackend({
        db,
        query: 'why could users not sign in',
        modelId: TEST_MODEL,
        scope: 'transcripts',
      });
      expect(prep.ok).toBe(true);
      const hits = prep.backend({ limit: 2 });
      expect(hits.length).toBeGreaterThan(0);
      // Paraphrase recall: "sign in" finds the login-credential turn first.
      expect(hits[0].id).toBe('T:context/transcripts/2026-06-10.md:7');
      expect(hits[0].snippet).toContain('rotating the expired API credential');

      // Scope isolation: the FACTS scope sees nothing (no observations seeded).
      const factsPrep = await prepareSemanticBackend({
        db,
        query: 'why could users not sign in',
        modelId: TEST_MODEL,
        scope: 'facts',
      });
      expect(factsPrep.ok).toBe(true);
      expect(factsPrep.backend({ limit: 5 })).toHaveLength(0);
    } finally {
      db.close();
    }
  }, 240_000);
});
