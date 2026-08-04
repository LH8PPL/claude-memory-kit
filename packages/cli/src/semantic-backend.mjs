// Layer 5b — the embedded semantic backend (Task 65, design §9.3.1 resolved).
//
// Architecture (the D-72 recipe on our stack):
//   - Vectors live INSIDE the kit's existing SQLite index (sqlite-vec vec0
//     virtual table) — one store, no server, no second index to sync.
//   - The embedder is a LOCAL ONNX model via @huggingface/transformers
//     (Node-native; Anthropic has no embeddings API). The dependency is
//     OPTIONAL (~258 MB with onnxruntime): this module lazy-imports it and
//     degrades to a clear "not installed" reason — keyword FTS5 stays the
//     always-available default (claude-mem precedent, §9.3.1).
//   - Embeddings are CONTENT-ADDRESSED (memweave pattern): sha256(model +
//     body) → vector in `embedding_cache`; re-syncs embed only new/changed
//     observations. The vec table mirrors `observations` rowids, so the
//     §9.2.1 mutation propagation (reindexBoot before every search) flows
//     straight into `syncSemanticIndex` — changed rows re-embed, deleted/
//     tombstoned rows drop out of the vec table.
//
// Async boundary (deliberate): `search()` is synchronous and its
// `semanticBackend` DI seam is a SYNC function (Task 120 kept it that way on
// purpose). Embedding a query is async. So the async work happens in
// `prepareSemanticBackend()` — it embeds the QUERY up front and returns a
// sync closure over the query vector for the seam. `search()`'s public
// contract is untouched.
//
// Observation granularity = embedding granularity: each indexed row is one
// embedding; no sub-row chunking. Most observations are small (bullets ≤200
// chars) but fact bodies have NO upstream length cap — the dogfood repo has a
// 5157-char fact (P-5VJJUEES), so the old "≤1500 by construction" assumption is
// FALSE. planEmbedBatches (below) bounds the embed forward pass by item-count
// AND total chars, and hard-truncates any single body to EMBED_BATCH_CHARS, so
// an oversized body can neither blow up the batch nor ride solo as a huge
// tensor. Recall is unaffected (mean-pooling is dominated by the leading text).

import { createHash } from 'node:crypto';
import { parseJsonFile } from './read-json.mjs';
import { join } from 'node:path';

// The D-105 ladder's WINNER (bake-off 2026-06-10, bench:recall on the Task-99
// corpus): bge-base-en-v1.5 — R@5 0.941 / paraphrase 1.000 in semantic mode,
// vs bge-small 0.824/0.900 and bge-m3 0.765/0.800 (the multilingual giant
// LOSES to the English-tuned base on short memory facts — the ladder found
// its ceiling at rung 2). 768-dim, ~110 MB q8 ONNX download on first use,
// cached by transformers.js. Dims are model-derived at sync time.
export const DEFAULT_MODEL_ID = 'Xenova/bge-base-en-v1.5';
export const DEFAULT_DIMS = 768;

// Batch bounds for the embed forward pass (P-5VJJUEES — the 2026-07-07 8.8GB
// machine freeze). transformers.js allocates the attention tensor for the WHOLE
// batch at once, off-heap, and PADS every sequence to the batch's LONGEST one —
// so cost scales with (batchSize × maxSeqLen²). An unbounded 471-body batch
// containing a 5000-char fact allocated ~9GB of native ONNX memory in one call.
// We bound BOTH axes: at most EMBED_BATCH_SIZE items per call AND at most
// EMBED_BATCH_CHARS total characters per call (a long fact forms a smaller/solo
// batch). Both overridable for tuning/tests.
export const EMBED_BATCH_SIZE = Number(process.env.CMK_EMBED_BATCH_SIZE) || 16;
export const EMBED_BATCH_CHARS = Number(process.env.CMK_EMBED_BATCH_CHARS) || 8000;

// Split an array of texts into batches bounded by BOTH item-count and total
// chars, so one very long body can't create a giant padded attention tensor.
// A single item is ALSO hard-truncated to maxChars (skill-review M1): fact
// bodies have no upstream length cap (the "≤1500 by construction" invariant is
// already false — the dogfood repo has a 5157-char fact), so without this a
// hypothetical 20k-char body would still allocate a huge single-item tensor.
// Mean-pooled embeddings are dominated by the leading text, so truncating the
// tail costs almost no recall while capping the worst case. Returns batches of
// the (possibly truncated) texts — callers embed these directly.
export function planEmbedBatches(texts, { maxItems = EMBED_BATCH_SIZE, maxChars = EMBED_BATCH_CHARS } = {}) {
  const batches = [];
  let cur = [];
  let curChars = 0;
  for (const raw of texts) {
    const t = raw.length > maxChars ? raw.slice(0, maxChars) : raw;
    const len = t.length;
    // A single body at/over the char budget rides in its own batch.
    if (cur.length > 0 && (cur.length >= maxItems || curChars + len > maxChars)) {
      batches.push(cur);
      cur = [];
      curChars = 0;
    }
    cur.push(t);
    curChars += len;
  }
  if (cur.length > 0) batches.push(cur);
  return batches;
}

// Module-level extractor cache: the ONNX session costs ~seconds to build;
// one per (process, model).
const extractorCache = new Map();

async function loadExtractor(modelId) {
  if (extractorCache.has(modelId)) return extractorCache.get(modelId);
  // Lazy optional import — the kit does NOT declare this dependency
  // (install weight; §9.3.1 vector-optional). Resolution order: the
  // project's node_modules, then global. Failure → a typed reason.
  let pipeline;
  try {
    ({ pipeline } = await import('@huggingface/transformers'));
  } catch {
    return null;
  }
  const extractor = await pipeline('feature-extraction', modelId, { dtype: 'q8' });
  extractorCache.set(modelId, extractor);
  return extractor;
}

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

function toBlob(floatArray) {
  return Buffer.from(new Float32Array(floatArray).buffer);
}

// Task 104.2 (D-117) — semantic scopes. Each scope pairs a vec table with
// the content table its rowids reference. The embedding_cache is SHARED
// (content-addressed: sha256(model+body) — the same text embeds once no
// matter which scope holds it).
const SEMANTIC_SCOPES = Object.freeze({
  facts: {
    vecTable: 'vec_observations',
    liveSql:
      'SELECT rowid, body FROM observations WHERE deleted_at IS NULL AND superseded_by IS NULL',
  },
  transcripts: {
    vecTable: 'vec_transcripts',
    liveSql: 'SELECT rowid, body FROM transcript_chunks',
  },
});

export function ensureSemanticSchema(db, { dims = DEFAULT_DIMS } = {}) {
  // sqlite-vec is a tiny prebuilt extension (regular dependency).
  // Loading twice is a no-op-safe guard via function probe.
  try {
    db.prepare('SELECT vec_version() AS v').get();
  } catch {
    throw new SqliteVecNotLoadedError();
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS embedding_cache (
      content_sha TEXT PRIMARY KEY,
      model TEXT NOT NULL,
      vector BLOB NOT NULL
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_observations USING vec0(
      embedding float[${dims}]
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS vec_transcripts USING vec0(
      embedding float[${dims}]
    );
    CREATE TABLE IF NOT EXISTS vec_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export class SqliteVecNotLoadedError extends Error {
  constructor() {
    super('sqlite-vec extension is not loaded on this db connection');
  }
}

export function loadSqliteVec(db) {
  // Separate from ensureSemanticSchema so callers that only READ can skip
  // schema DDL. sqlite-vec ships per-platform prebuilds; load() picks one.
  // Idempotent: probe before loading (loading twice on one connection
  // would re-register the extension).
  try {
    db.prepare('SELECT vec_version() AS v').get();
    return Promise.resolve(true);
  } catch {
    // not loaded yet — fall through to the real load
  }
  return import('sqlite-vec').then((m) => {
    m.load(db);
    return true;
  }).catch(() => false);
}

/**
 * Incrementally sync the vec table against `observations`. Embeds only
 * rows whose content hash misses the cache (content-addressed); removes
 * vec rows for deleted/tombstoned observations. Returns counts.
 */
export async function syncSemanticIndex({
  db,
  modelId = DEFAULT_MODEL_ID,
  dims = null,
  scope = 'facts',
  // DI seam (P-5VJJUEES chunking test): inject a fake extractor to assert
  // batch sizes deterministically without the ~110MB model. Defaults to the
  // real cached ONNX pipeline.
  extractorImpl = null,
}) {
  const scopeDef = SEMANTIC_SCOPES[scope];
  if (!scopeDef) return { ok: false, reason: `unknown-scope:${scope}` };
  // Public boundary in its own right — load the vec extension if this
  // connection doesn't have it yet (prepareSemanticBackend also loads it;
  // both entries must be self-sufficient).
  const vecLoaded = await loadSqliteVec(db);
  if (!vecLoaded) {
    return { ok: false, reason: 'sqlite-vec-unavailable' };
  }
  const extractor = extractorImpl ?? (await loadExtractor(modelId));
  if (!extractor) {
    return { ok: false, reason: 'embedder-not-installed' };
  }
  // Dims are MODEL-DERIVED (bge-small 384, bge-base 768, bge-m3 1024 — the
  // D-105 ladder changes models, and a vec0 table's dims are fixed at
  // creation). Probe once per sync; recreate the vec table when the model
  // OR its dims change (different vector space either way).
  if (dims == null) {
    const probe = await extractor('dims probe', { pooling: 'mean', normalize: true });
    dims = probe.tolist()[0].length;
  }
  ensureSemanticSchema(db, { dims });

  // Model/dims change invalidates BOTH scopes' vec tables (different space).
  const meta = db.prepare("SELECT value FROM vec_meta WHERE key = 'model'").get();
  const dimsMeta = db.prepare("SELECT value FROM vec_meta WHERE key = 'dims'").get();
  if ((meta && meta.value !== modelId) || (dimsMeta && Number(dimsMeta.value) !== dims)) {
    db.exec('DROP TABLE IF EXISTS vec_observations; DROP TABLE IF EXISTS vec_transcripts;');
    ensureSemanticSchema(db, { dims });
  }
  const putMeta = db.prepare(
    'INSERT INTO vec_meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  );
  putMeta.run('model', modelId);
  putMeta.run('dims', String(dims));

  const live = db.prepare(scopeDef.liveSql).all();

  // Drop vec rows that no longer correspond to live content rows.
  const liveRowids = new Set(live.map((r) => BigInt(r.rowid)));
  const vecRows = db.prepare(`SELECT rowid FROM ${scopeDef.vecTable}`).all();
  const dropStmt = db.prepare(`DELETE FROM ${scopeDef.vecTable} WHERE rowid = ?`);
  let dropped = 0;
  for (const r of vecRows) {
    if (!liveRowids.has(BigInt(r.rowid))) {
      dropStmt.run(BigInt(r.rowid));
      dropped += 1;
    }
  }

  // Content-addressed embed: only rows whose (model+body) hash is uncached
  // OR whose vec row is missing/stale get (re)embedded/(re)inserted.
  const cacheGet = db.prepare('SELECT vector FROM embedding_cache WHERE content_sha = ?');
  const cachePut = db.prepare(
    'INSERT OR REPLACE INTO embedding_cache(content_sha, model, vector) VALUES (?, ?, ?)',
  );
  const vecGet = db.prepare(`SELECT rowid FROM ${scopeDef.vecTable} WHERE rowid = ?`);
  const vecDel = db.prepare(`DELETE FROM ${scopeDef.vecTable} WHERE rowid = ?`);
  const vecPut = db.prepare(`INSERT INTO ${scopeDef.vecTable}(rowid, embedding) VALUES (?, ?)`);

  const toEmbed = [];
  const plans = []; // {rowid, sha, cached?, body}
  for (const row of live) {
    // Skip empty/whitespace-only bodies (skill-review M2): mean-pooling an
    // empty sequence yields a NaN/degenerate vector, and an empty fact can
    // never be a useful semantic match. Excluded from BOTH the embed input and
    // the plans walk below, so the vecList↔plans order-mapping stays exact.
    if (!row.body || !String(row.body).trim()) continue;
    const sha = sha256(`${modelId}\n${row.body}`);
    const cached = cacheGet.get(sha);
    plans.push({ rowid: BigInt(row.rowid), sha, cached: cached?.vector ?? null, body: row.body });
    if (!cached) toEmbed.push(row.body);
  }

  let embedded = 0;
  let vectorsBySha = new Map();
  if (toEmbed.length > 0) {
    // Embed in bounded BATCHES, not one giant forward pass (P-5VJJUEES — the
    // 2026-07-07 8.8GB machine freeze). transformers.js pads a batch to its
    // longest sequence and allocates the full attention tensor for the WHOLE
    // batch at once, off-heap — so cost scales with (batchSize × maxSeqLen²).
    // planEmbedBatches bounds BOTH axes (item count AND total chars), so ~471
    // bodies — including a 5000-char fact — never form the single giant padded
    // tensor that ran the machine out of memory. planEmbedBatches preserves
    // input order, so vecList maps back to the uncached plans 1:1.
    const uncachedBodies = plans.filter((p) => !p.cached).map((p) => p.body);
    const vecList = [];
    for (const batch of planEmbedBatches(uncachedBodies)) {
      const out = await extractor(batch, { pooling: 'mean', normalize: true });
      for (const v of out.tolist()) vecList.push(v);
    }
    // Fail CLOSED on a count mismatch (skill-review I1). The vecList[i++] map
    // below is correct only if every batch returned exactly its input count; if
    // an extractor call ever returns fewer/more rows, the vectors desync and we
    // would silently cache WRONG (content-addressed → durable) embeddings. A
    // mismatch → bail so the caller falls back to FTS rather than poisoning the
    // cache. Cheap invariant, catastrophic to skip.
    if (vecList.length !== uncachedBodies.length) {
      return {
        ok: false,
        reason: `embed-count-mismatch:${vecList.length}/${uncachedBodies.length}`,
      };
    }
    let i = 0;
    for (const plan of plans) {
      if (plan.cached) continue;
      const vec = vecList[i++];
      const blob = toBlob(vec);
      cachePut.run(plan.sha, modelId, blob);
      vectorsBySha.set(plan.sha, blob);
      embedded += 1;
    }
  }

  let upserted = 0;
  for (const plan of plans) {
    const blob = plan.cached ?? vectorsBySha.get(plan.sha);
    if (!blob) continue;
    // vec0 has no UPSERT; delete+insert only when absent or content changed.
    // Cheap presence probe; content change implies a NEW sha (content-
    // addressed), which implies the row was just embedded → refresh it.
    const present = vecGet.get(plan.rowid);
    if (present && plan.cached) {
      continue; // unchanged + already in the vec table
    }
    if (present) vecDel.run(plan.rowid);
    vecPut.run(plan.rowid, blob);
    upserted += 1;
  }

  return { ok: true, embedded, upserted, dropped, total: live.length };
}

/**
 * The async entry the CLI/MCP callers use. Embeds the QUERY, syncs the vec
 * index, and returns a SYNC `backend` function matching the search() DI
 * seam contract: (opts) => [{id, snippet, source_file, source_line, tier,
 * trust, score}] — score in [0,1], higher = closer.
 */
// The semantic post-filters, extracted as a pure seam so the `since`/tier/
// trust/tombstone/expiry semantics are unit-testable WITHOUT the embedder.
// Task 227 skill-review find (pre-existing bug, fixed here): `created_at` is
// ALREADY epoch ms (index-rebuild's isoToEpochMs = Date.parse); the old
// `r.created_at * 1000` assumed seconds, making the left side ~3 orders too
// large so `since` could never exclude a row in semantic mode — silently
// ignored. The keyword path (search.mjs @since_ms) compares ms-to-ms; now
// this does too.
const MIN_TRUST_RANK = { low: 0, medium: 1, high: 2 };
export function semanticRowPassesFilters(r, opts = {}, nowMs = Date.now()) {
  if (!opts.includeTombstoned && r.deleted_at != null) return false;
  // Exclusive end: expires_at == now is already expired (D-258).
  if (!opts.includeExpired && r.expires_at != null && nowMs >= r.expires_at) return false;
  if (opts.tier && r.tier !== opts.tier) return false;
  if (opts.minTrust && MIN_TRUST_RANK[r.trust] < MIN_TRUST_RANK[opts.minTrust]) return false;
  if (opts.since) {
    const sinceMs = Date.parse(opts.since);
    if (Number.isFinite(sinceMs) && r.created_at < sinceMs) return false;
  }
  return true;
}

export async function prepareSemanticBackend({
  db,
  query,
  modelId = DEFAULT_MODEL_ID,
  dims = null,
  overFetch = 3,
  scope = 'facts',
  // DI seam, parity with syncSemanticIndex (Task 261): inject a fake extractor
  // so the FULL semantic path — sync + query + the vec→content join — is
  // exercisable without the ~110MB ONNX model. The vec-rowid corruption class
  // (D-421) lives in that join, so its regression test must be a deterministic
  // always-on gate, not one that skips whenever the optional embedder is absent.
  extractorImpl = null,
  // Leak guard (P-5VJJUEES): syncSemanticIndex re-scans + re-embeds the WHOLE
  // corpus, allocating large off-heap ONNX buffers. A hot loop that calls this
  // per item (temporalSweep's per-fact finder) must sync ONCE, then pass
  // syncIndex:false so each subsequent call only embeds its query and searches
  // the already-synced vec table. Default true preserves every existing caller.
  syncIndex = true,
}) {
  if (!SEMANTIC_SCOPES[scope]) {
    return { ok: false, reason: `unknown-scope:${scope}` };
  }
  // User control: force-disable the semantic layer (e.g. block the one-time
  // model download on a metered machine, or pin keyword-only behavior).
  // Also the deterministic test hook for the absent-backend error contract.
  if (process.env.CMK_DISABLE_SEMANTIC === '1') {
    return {
      ok: false,
      reason: 'disabled-by-env',
      hint: 'CMK_DISABLE_SEMANTIC=1 is set — unset it to enable semantic/hybrid search.',
    };
  }
  const vecLoaded = await loadSqliteVec(db).catch(() => false);
  if (!vecLoaded) {
    return { ok: false, reason: 'sqlite-vec-unavailable' };
  }
  const extractor = extractorImpl ?? (await loadExtractor(modelId));
  if (!extractor) {
    return {
      ok: false,
      reason: 'embedder-not-installed',
      hint:
        'semantic search needs the optional local embedder — install it with: npm install -g @huggingface/transformers ' +
        '(~260 MB incl. ONNX runtime; the model itself downloads once on first use). Keyword search works without it.',
    };
  }
  // syncIndex:false skips the full-corpus re-embed (the caller synced already
  // and only wants a query embed against the live vec table) — P-5VJJUEES.
  const sync = syncIndex
    ? await syncSemanticIndex({ db, modelId, dims, scope, extractorImpl })
    : { ok: true, skipped: true };
  if (!sync.ok) return { ok: false, reason: sync.reason };

  const qOut = await extractor(query, { pooling: 'mean', normalize: true });
  const qBlob = toBlob(qOut.tolist()[0]);

  const backend =
    scope === 'transcripts'
      ? (opts = {}) => {
          const limit = opts.limit ?? 20;
          // No post-filters in this scope (chunks carry no tier/trust/dates
          // — search() rejects those filters up front), so no over-fetch.
          const rows = db
            .prepare(
              `SELECT m.distance AS distance,
                      t.source_file, t.source_line, t.heading, t.body
                 FROM (SELECT rowid, distance FROM vec_transcripts
                        WHERE embedding MATCH ? ORDER BY distance LIMIT ?) m
                 JOIN transcript_chunks t ON t.rowid = m.rowid
                ORDER BY m.distance`,
            )
            .all(qBlob, limit);
          return rows.map((r) => ({
            // The synthetic T: id — search()'s transcript keyword backend
            // produces the same key, so hybrid RRF fuses correctly.
            id: `T:${r.source_file}:${r.source_line}`,
            // Flatten + bound like the keyword side: raw turn bodies are
            // multi-line and up to 1500 chars — too heavy for a result line.
            snippet: (() => {
              const flat = String(r.body ?? '').replace(/\s+/g, ' ').trim();
              return flat.length > 240 ? flat.slice(0, 240) + '…' : flat;
            })(),
            source_file: r.source_file,
            source_line: r.source_line,
            heading: r.heading,
            score: Math.max(0, 1 - r.distance / 2),
          }));
        }
      : (opts = {}) => {
          const limit = opts.limit ?? 20;
          // Over-fetch (D-72: ~3×) so post-filters (tier/trust/since) don't
          // starve the result list.
          const k = Math.max(limit * overFetch, limit);
          // KNN subquery FIRST (sqlite-vec needs MATCH + LIMIT pushed into the
          // virtual-table scan), then join observation metadata.
          const rows = db
            .prepare(
              `SELECT m.rowid AS rowid, m.distance AS distance,
                      o.id, o.body, o.source_file, o.source_line, o.tier, o.trust,
                      o.created_at, o.deleted_at, o.expires_at
                 FROM (SELECT rowid, distance FROM vec_observations
                        WHERE embedding MATCH ? ORDER BY distance LIMIT ?) m
                 JOIN observations o ON o.rowid = m.rowid
                ORDER BY m.distance`,
            )
            .all(qBlob, k);

          // Task 66.3: expiry clock — injectable via opts.now, same contract
          // as the keyword path's @now_ms (search.mjs).
          const nowMs = opts.now ? Date.parse(opts.now) : Date.now();
          const filtered = rows.filter((r) => semanticRowPassesFilters(r, opts, nowMs));

          return filtered.slice(0, limit).map((r) => ({
            id: r.id,
            snippet: r.body,
            source_file: r.source_file,
            source_line: r.source_line,
            tier: r.tier,
            trust: r.trust,
            // cosine distance (normalized vectors) ∈ [0,2] → similarity ∈ [0,1].
            score: Math.max(0, 1 - r.distance / 2),
            created_at: r.created_at,
          }));
        };

  return { ok: true, backend, sync };
}

// --- Task 46: default-mode resolution + install-time warm-up ---------------

const VALID_DEFAULT_MODES = new Set(['keyword', 'semantic', 'hybrid']);

/**
 * The project's default search mode (Task 46): `context/settings.json` →
 * `search.default_mode`. Written by `cmk install --with-semantic` (hybrid) /
 * `--no-semantic` (keyword); absent/invalid → 'keyword' (the status-quo
 * default — no surprise model downloads on machines that never opted in).
 */
export function resolveDefaultSearchMode({ projectRoot }) {
  // BOM-tolerant (parseJsonFile): a Windows-editor BOM on context/settings.json
  // must not silently downgrade a `hybrid` user to keyword (D-187). Missing or
  // malformed → keyword.
  const p = join(projectRoot, 'context', 'settings.json');
  const mode = parseJsonFile(p, { fallback: null })?.search?.default_mode;
  return VALID_DEFAULT_MODES.has(mode) ? mode : 'keyword';
}

/**
 * Install-time warm-up (Task 46): load the extractor once so the one-time
 * model download happens during `cmk install --with-semantic`, not as a
 * surprise on the user's first search. Best-effort — failure reports a
 * reason, never throws.
 */
/**
 * The near-dup threshold for bge-base cosine — MEASURED, not assumed
 * (live bake 2026-06-13, real Xenova/bge-base-en-v1.5 q8):
 *   must-catch paraphrases:      0.85 ("use uv not pip" pair) · 0.96 · 0.81
 *   must-NOT-catch (same domain, different facts): 0.66 · 0.64
 * 0.78 splits the gap with ≥0.03 margin on the catch side and ≥0.12 on the
 * miss side; q8 quantization flutters scores ±0.003 across processes, so a
 * threshold inside the gap matters. The pre-143 DEFAULT_SEMANTIC_THRESHOLD
 * (0.85, conflict-queue.mjs) predates the real embedder and would MISS the
 * task's own canonical example (0.8493 < 0.85) — caught by the live test.
 */
export const SEMANTIC_NEARDUP_THRESHOLD = 0.78;

/**
 * Build a write-time semantic similarity function (Task 143, D-130).
 *
 * For the EXPLICIT capture paths (cmk remember / mk_remember): embeds the
 * INCOMING text once (the only async model call), then returns a SYNC
 * `similarityFn(newText, existingText)` compatible with detectConflicts'
 * injectable seam:
 *   - candidate vector found in the content-addressed embedding cache
 *     (sha256(model\ntext) — the same key syncSemanticIndex writes) →
 *     cosine (vectors are normalized, so a dot product);
 *   - cache miss (a bullet captured since the last reindex) → token-Jaccard
 *     fallback FOR THAT PAIR — honest literal comparison, never a throw,
 *     never a per-pair model call (budget: one embed per capture, total).
 *
 * Not-ok states ({ok:false, reason}) let callers degrade silently to the
 * literal pipeline (the spec's graceful-degradation contract):
 *   'embedder-not-installed' — the optional embedder is absent.
 *   'embed-failed: …'        — the model errored on the incoming text.
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} opts.newText - the incoming capture.
 * @param {string} [opts.modelId]
 * @param {Function} [opts.extractorImpl] - test seam: async () => extractor|null
 *   (the loadExtractor shape).
 * @param {Function} [opts.cacheLookupImpl] - test seam: (text) => number[]|null.
 * @returns {Promise<{ok:true, similarityFn:Function, backend:'semantic'} | {ok:false, reason:string}>}
 */
export async function prepareSemanticSimilarity({
  projectRoot,
  newText,
  modelId = DEFAULT_MODEL_ID,
  extractorImpl,
  cacheLookupImpl,
} = {}) {
  // Honor the global semantic kill-switch (consistency with
  // prepareSemanticBackend) — the near-dup guard degrades to {} just like
  // search degrades to keyword. Skipped when a test injects an extractor.
  if (!extractorImpl && process.env.CMK_DISABLE_SEMANTIC === '1') {
    return { ok: false, reason: 'embedder-disabled' };
  }
  const load = extractorImpl ?? (() => loadExtractor(modelId));
  const extractor = await load();
  if (!extractor) return { ok: false, reason: 'embedder-not-installed' };

  let newVec;
  try {
    const out = await extractor(newText, { pooling: 'mean', normalize: true });
    newVec = (out.tolist())[0] ?? out.tolist();
    // Single-text extractor output is [[...]]; the fake seam may return [...].
    if (Array.isArray(newVec[0])) newVec = newVec[0];
  } catch (err) {
    return { ok: false, reason: `embed-failed: ${err?.message ?? err}` };
  }

  // Candidate lookup: SNAPSHOT the embedding cache up front and CLOSE the
  // connection immediately — the returned similarityFn's lifetime is the
  // caller's business, and a connection held in the closure would leak one
  // db handle per capture inside the long-running MCP server (skill-review
  // blocking finding). Size is fine: 768 floats × 4B ≈ 3KB/row. A missing /
  // schema-less db (semantic never synced) degrades every pair to Jaccard.
  let lookup = cacheLookupImpl;
  if (!lookup) {
    let bySha = null;
    try {
      const { openIndexDb } = await import('./index-db.mjs');
      const db = openIndexDb({ projectRoot });
      try {
        bySha = new Map();
        for (const row of db.prepare('SELECT content_sha, vector FROM embedding_cache WHERE model = ?').all(modelId)) {
          bySha.set(
            row.content_sha,
            Array.from(new Float32Array(row.vector.buffer, row.vector.byteOffset, row.vector.byteLength / 4)),
          );
        }
      } finally {
        db.close();
      }
    } catch {
      bySha = null;
    }
    lookup = bySha ? (text) => bySha.get(sha256(`${modelId}\n${text}`)) ?? null : () => null;
  }

  const { tokenJaccardSimilarity } = await import('./conflict-queue.mjs');
  const similarityFn = (a, b) => {
    try {
      const candidate = lookup(b);
      if (!candidate || candidate.length !== newVec.length) {
        return tokenJaccardSimilarity(a, b);
      }
      let dot = 0;
      for (let i = 0; i < newVec.length; i++) dot += newVec[i] * candidate[i];
      return dot; // normalized vectors → dot IS cosine
    } catch {
      return tokenJaccardSimilarity(a, b);
    }
  };
  return { ok: true, similarityFn, backend: 'semantic' };
}

export async function warmEmbedder({ modelId = DEFAULT_MODEL_ID } = {}) {
  const t0 = Date.now();
  try {
    const extractor = await loadExtractor(modelId);
    if (!extractor) return { ok: false, reason: 'embedder-not-installed' };
    await extractor('warm-up', { pooling: 'mean', normalize: true });
    return { ok: true, modelId, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, reason: err?.message ?? String(err) };
  }
}

// --- Post-fusion rerank (D-72: keyword-overlap 0.30 + temporal 0.40) -------

const RERANK_STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'be', 'do', 'for', 'how', 'in', 'is', 'it', 'of',
  'on', 'or', 'our', 'the', 'this', 'to', 'we', 'what', 'when', 'where',
  'which', 'with',
]);

function contentTokens(text) {
  return new Set(
    (text ?? '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !RERANK_STOPWORDS.has(t)),
  );
}

// Parse "in late May", "~2 weeks ago", "early June" style hints → a target
// epoch-ms, or null. Deliberately heuristic: the date boost should help
// temporal questions without an LLM call (MemPalace's pattern).
export function parseTemporalHint(query, now = Date.now()) {
  const q = query.toLowerCase();
  const ago = q.match(/(\d+)\s*(day|week|month)s?\s*ago/);
  if (ago) {
    const n = Number(ago[1]);
    const unitMs = { day: 86_400_000, week: 604_800_000, month: 2_592_000_000 }[ago[2]];
    return now - n * unitMs;
  }
  const months = ['january','february','march','april','may','june','july','august','september','october','november','december'];
  for (let m = 0; m < 12; m++) {
    if (q.includes(months[m])) {
      const d = new Date(now);
      let year = d.getUTCFullYear();
      // A month later than "now" almost certainly refers to LAST year's.
      if (m > d.getUTCMonth()) year -= 1;
      let day = 15;
      if (q.includes(`early ${months[m]}`)) day = 5;
      if (q.includes(`late ${months[m]}`)) day = 25;
      return Date.UTC(year, m, day);
    }
  }
  return null;
}

/**
 * Rerank fused results: keyword-overlap boost (weight 0.30) + temporal-
 * proximity boost (weight 0.40, only when the query carries a date hint
 * and the result carries created_at). Pure + deterministic (zero API) —
 * the D-72 "~98% without LLM" stage. Results without created_at simply
 * skip the temporal term.
 */
export function rerankResults(results, { query, now = Date.now(), temporalWindowMs = 45 * 86_400_000 } = {}) {
  const qTokens = contentTokens(query);
  const target = parseTemporalHint(query, now);
  const scored = results.map((r, i) => {
    let s = r.score ?? 0;
    if (qTokens.size > 0) {
      const rTokens = contentTokens(r.snippet);
      let overlap = 0;
      for (const t of qTokens) if (rTokens.has(t)) overlap += 1;
      s *= 1 + 0.3 * (overlap / qTokens.size);
    }
    if (target != null && r.created_at != null) {
      const diff = Math.abs(r.created_at * 1000 - target);
      const boost = Math.max(0, 0.4 * (1 - diff / temporalWindowMs));
      s *= 1 + boost;
    }
    return { ...r, score: s, _i: i };
  });
  scored.sort((a, b) => b.score - a.score || a._i - b._i);
  return scored.map(({ _i, ...r }) => r);
}
