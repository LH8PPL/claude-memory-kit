// link-facts.mjs — WRITE-TIME FACT LINKING (Task 262, ADR-0023's DEFER resolved
// by firing its own trigger; D-433).
//
// THE PROBLEM, measured. 2,220 facts, 89 linked (4.0%), 175 edges. The
// breakdown indicts the WRITER, not the users: `project` facts (auto-extract,
// 97% of the corpus) are 3.7% linked while hand-written types run 8.3%-33%.
// Linking was always a human habit and we automated the writing without
// automating the habit — `writeFact` has accepted a `related` option since
// Task 7 (write-fact.mjs) and nothing ever passed it.
//
// THE MECHANISM. On every fact create the incoming body is scored against the
// live same-tier corpus and split into the three bands settled in the grill:
//
//   score >= nearDupThreshold   NEAR-DUP / supersedes-shaped. NOT auto-linked —
//                               routed to the CONFLICT QUEUE as a proposal a
//                               human resolves (Task 25 / §6.8). Different
//                               risk, different treatment (grill Q8).
//   floor <= score < nearDup    RELATED. Auto-applied, capped at LINK_CAP=3
//                               out-links, highest score first.
//   score < floor               NOTHING.
//
// THE FLOOR IS DERIVED, NEVER A CONSTANT (grill Q3). 0.78 is only meaningful
// relative to bge-base's own random-pair p99 of 0.773; swap the model — or the
// backend — and a hard-coded number means nothing. So the floor is the
// p99 of THIS corpus's random-pair similarity distribution under THIS backend,
// computed at index time, stored WITH its provenance in the index `meta` table
// (derived state, rebuilt on every full reindex — ADR-0002), and read at write
// time. No floor in the index → the fact is written UNLINKED.
//
// CAPTURE > LINKING, ALWAYS. Every entry point here is best-effort: a missing
// index, a stale floor, a throwing backend, a locked db — all degrade to "write
// the fact with no links and let the backfill catch it". Linking must never
// block, slow past its budget, or fail a capture.
//
// CAP 3 OUT-LINKS, IN-DEGREE UNCAPPED (grill Q5, evidenced by the 2026-08-04
// link-cap research). One direction is written — onto the NEW fact's `related:`
// frontmatter — because graph-index already traverses `in|out|both`, so
// backlinks are free without rewriting an existing fact file. That is also what
// makes the over-mutation guarantee trivially true: a link write touches
// exactly one file.
//
// SHARED MODULES (CLAUDE.md): similarity comes from conflict-queue
// (tokenJaccardSimilarity) and semantic-backend (prepareSemanticSimilarity +
// SEMANTIC_NEARDUP_THRESHOLD — Task 143's ALREADY-CALIBRATED near-dup seam,
// reused rather than re-rolled); tier paths from tier-paths; audit from
// audit-log; the queue from conflict-queue; result shapes from result-shapes.

import { join } from 'node:path';
import { appendAuditEntry, nowIso, REASON_CODES } from './audit-log.mjs';
import {
  tokenJaccardSimilarity,
  tokenSetOf,
  jaccardOfTokenSets,
  writeConflictEntry,
  SUBSTRING_NEARDUP_THRESHOLD,
} from './conflict-queue.mjs';
import { parseJsonFile } from './read-json.mjs';
// The filename→slug rule, shared with rebuildEdges so a written slug and a
// resolved slug can never be two different rules.
import { slugForFactFilename } from './graph-index.mjs';
// Static, not lazy: the sync write path must never await. semantic-backend has
// no heavy top-level side effects — the ~110 MB ONNX import lives behind
// `loadExtractor`, so importing the key derivation + the calibrated threshold
// costs nothing on a machine without the embedder.
import {
  embeddingCacheKey,
  SEMANTIC_NEARDUP_THRESHOLD as SEMANTIC_NEARDUP,
} from './semantic-backend.mjs';

// --- Tunables ---------------------------------------------------------------

/**
 * Out-links written per fact. In-degree is deliberately UNCAPPED.
 *
 * Evidenced, not picked (grill Q5 / the 2026-08-04 link-cap research): our own
 * UNCAPPED human writer already chose median 2 / max 4; Memora caps 1-3;
 * Wikipedia ships 3 in production; Beel's 3.4M-impression study inflects at
 * 5-6 and 74% of digital libraries show 3-5; and our own neighbour curve has
 * k=4 within 0.01 of k=12 — past 3 you buy noise, not recall.
 */
export const LINK_CAP = 3;

/** The quantile of the random-pair distribution the related-band floor sits at. */
export const FLOOR_QUANTILE = 0.99;

/**
 * Below this many live facts a random-pair distribution is not a distribution,
 * it is an anecdote. Under it `computeLinkFloor` returns null and the writer
 * links nothing — the honest answer, not a guessed constant.
 */
export const MIN_FLOOR_ITEMS = 24;

/** Sampling bounds — the floor derivation runs inside a reindex, so it is capped. */
export const FLOOR_MAX_ITEMS = 600;
export const FLOOR_MAX_PAIRS = 20_000;

/**
 * Above this many live same-tier facts the linear write-time scan stops being
 * a rounding error on a write that already reindexes. We link nothing rather
 * than silently spend an unbounded budget on the capture path.
 *
 * Ship trigger for the bounded-candidate path (an FTS/vec prefilter instead of
 * a full scan): the first corpus that crosses it. At 2,260 facts the dogfood
 * repo is an order of magnitude below.
 */
export const MAX_SCAN_FACTS = 20_000;

/** meta-table key prefix for a stored floor record. */
const FLOOR_META_PREFIX = 'link_floor:';

/**
 * Fact files live at `<tier-root>/memory/<type>_<slug>.md` — EXCEPT the user
 * tier, whose fact dir is `fragments/` (tier-paths.resolveFactDir). So the
 * indexed `source_file` is `context/memory/x.md` (P), `context.local/memory/x.md`
 * (L) or `fragments/x.md` (U). Both names are matched: the first version of this
 * regex knew only `memory/` and silently excluded every user-tier fact from
 * both the floor sample and the candidate scan — caught by the cross-tier test.
 *
 * The single trailing segment excludes the archive (`memory/archive/superseded/…`)
 * and tombstones by construction. Scratchpad bullets are NOT linkable at all:
 * `related:` is fact-file frontmatter.
 */
const FACT_SOURCE_RE = /(^|\/)(memory|fragments)\/[^/]+\.md$/;

/**
 * `context/memory/project_foo-bar.md` → `foo-bar` (the slug `related:` stores).
 *
 * The filename→slug rule itself is graph-index's `slugForFactFilename` — the
 * SAME function `rebuildEdges` resolves `related:` values with. A second copy
 * here would be a slug the writer produces and the edge builder cannot resolve,
 * i.e. a fact linked to a dangling target. This only adds the path→basename
 * step, because the index stores a relative path where graph-index has a
 * filename.
 */
export function slugForFactSource(sourceFile) {
  return slugForFactFilename(String(sourceFile ?? '').split('/').pop() ?? '');
}

// --- The flag ---------------------------------------------------------------

/**
 * Is write-time linking on for this project?
 *
 * Precedence (the kit's usual env-over-settings shape):
 *   1. `CMK_LINK_FACTS` = 0/false/off → OFF, = 1/true/on → ON. The A/B switch:
 *      sub-task 4 measures OFF vs ON on ONE build.
 *   2. `context/settings.json` → `memory.link_facts` (boolean).
 *   3. default ON — the task's intent is that facts link themselves.
 */
export function linkingEnabled({ projectRoot } = {}) {
  const env = process.env.CMK_LINK_FACTS;
  if (env !== undefined && env !== '') {
    return !/^(0|false|off|no)$/i.test(env.trim());
  }
  const configured = parseJsonFile(join(projectRoot ?? '.', 'context', 'settings.json'), {
    fallback: null,
  })?.memory?.link_facts;
  if (typeof configured === 'boolean') return configured;
  return true;
}

// --- The floor --------------------------------------------------------------

// Deterministic PRNG (xorshift32). The floor lands in the rebuildable index, so
// non-determinism would be tolerable — but a floor that moves between two
// rebuilds of the SAME corpus is undebuggable, and a seeded sampler makes the
// derivation reproducible from the corpus alone.
function makeRng(seed) {
  let s = (seed | 0) || 0x2545f491;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 0x100000000) / 0x100000000;
  };
}

function quantile(sortedAsc, q) {
  if (sortedAsc.length === 0) return null;
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil(q * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

/**
 * Derive the related-band floor from the corpus's OWN random-pair similarity
 * distribution under one backend.
 *
 * @param {object} opts
 * @param {Array<{id:string, text:string}>} opts.items  the live corpus sample source
 * @param {(a:string,b:string)=>number} opts.similarityFn
 * @param {number} [opts.quantile=FLOOR_QUANTILE]
 * @param {number} [opts.maxItems=FLOOR_MAX_ITEMS]
 * @param {number} [opts.maxPairs=FLOOR_MAX_PAIRS]
 * @param {number} [opts.seed]
 * @returns {{floor:number, quantile:number, pairs:number, sampledItems:number,
 *            median:number, max:number} | null}  null when the corpus is too small.
 */
export function computeLinkFloor({
  items,
  similarityFn,
  quantile: q = FLOOR_QUANTILE,
  maxItems = FLOOR_MAX_ITEMS,
  maxPairs = FLOOR_MAX_PAIRS,
  seed = 0x9e3779b9,
} = {}) {
  const usable = (items ?? []).filter((it) => typeof it?.text === 'string' && it.text.trim().length > 0);
  if (usable.length < MIN_FLOOR_ITEMS) return null;

  // Deterministic stride sample when the corpus exceeds the bound — a stride
  // keeps the sample spread across the (id-sorted) corpus instead of taking a
  // contiguous, potentially topically-clustered head.
  let sample = usable;
  if (usable.length > maxItems) {
    const stride = usable.length / maxItems;
    sample = Array.from({ length: maxItems }, (_, i) => usable[Math.floor(i * stride)]);
  }

  const rng = makeRng(seed ^ sample.length);
  const n = sample.length;
  const totalPairs = (n * (n - 1)) / 2;
  const target = Math.min(maxPairs, totalPairs);
  const scores = [];
  const seen = new Set();
  // Bounded attempts: with target << totalPairs the rejection rate is tiny, and
  // the cap keeps a pathological duplicate streak from spinning.
  for (let attempts = 0; scores.length < target && attempts < target * 4; attempts++) {
    const i = Math.floor(rng() * n);
    let j = Math.floor(rng() * n);
    if (i === j) j = (j + 1) % n;
    const key = i < j ? `${i}:${j}` : `${j}:${i}`;
    if (seen.has(key)) continue;
    seen.add(key);
    let s = 0;
    try {
      s = similarityFn(sample[i].text, sample[j].text);
    } catch {
      continue; // a backend hiccup on one pair must not abort the derivation
    }
    if (Number.isFinite(s)) scores.push(s);
  }
  if (scores.length === 0) return null;
  scores.sort((a, b) => a - b);
  return {
    floor: quantile(scores, q),
    quantile: q,
    pairs: scores.length,
    sampledItems: n,
    median: quantile(scores, 0.5),
    max: scores[scores.length - 1],
  };
}

/** Read a stored floor record for `backend`, or null. */
export function readLinkFloor(db, backend) {
  try {
    const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(`${FLOOR_META_PREFIX}${backend}`);
    if (!row?.value) return null;
    const rec = JSON.parse(row.value);
    return typeof rec?.floor === 'number' && Number.isFinite(rec.floor) ? rec : null;
  } catch {
    return null;
  }
}

/** Store a floor record (single-writer, same posture as `edges_built_at`). */
export function writeLinkFloor(db, backend, record) {
  db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(`${FLOOR_META_PREFIX}${backend}`, JSON.stringify(record));
}

/** Every live, non-expired FACT row in the index (optionally one tier). */
export function liveFactRows(db, { tier = null, now = Date.now() } = {}) {
  const rows = db
    .prepare(
      `SELECT id, tier, source_file, body, trust FROM observations
        WHERE deleted_at IS NULL AND superseded_by IS NULL
          AND (expires_at IS NULL OR expires_at > @now)
        ORDER BY id ASC`,
    )
    .all({ now });
  return rows.filter(
    (r) => FACT_SOURCE_RE.test(r.source_file ?? '') && (tier == null || r.tier === tier),
  );
}

/**
 * Recompute + store the floors at INDEX TIME (called from reindexFull, and by
 * the backfill when a floor is missing).
 *
 * - `jaccard` is always derivable (pure lexical, no optional dependency).
 * - `semantic` is derived only when the content-addressed `embedding_cache`
 *   already holds vectors for enough live bodies. It is never computed by
 *   embedding here: the floor derivation runs inside a reindex and must not
 *   load a 110 MB ONNX model or make a model call.
 *
 * Best-effort by contract — a failure returns nulls and leaves the previous
 * record alone; the caller (a reindex) must not be turned into an error.
 */
export function refreshLinkFloors(db, { modelId = null, now = null } = {}) {
  const out = { jaccard: null, semantic: null };
  let rows;
  try {
    rows = liveFactRows(db);
  } catch {
    return out;
  }
  const computedAt = now ?? nowIso();
  const items = rows.map((r) => ({ id: r.id, text: r.body }));

  try {
    // Tokenize the sample ONCE: the derivation draws up to 20,000 pairs, so the
    // pairwise re-tokenizing form would tokenize the same bodies 40,000 times.
    const tokens = new Map(items.map((it) => [it.text, tokenSetOf(it.text)]));
    const j = computeLinkFloor({
      items,
      similarityFn: (a, b) => jaccardOfTokenSets(tokens.get(a) ?? tokenSetOf(a), tokens.get(b) ?? tokenSetOf(b)),
    });
    if (j) {
      out.jaccard = { backend: 'jaccard', corpusSize: items.length, computedAt, ...j };
      writeLinkFloor(db, 'jaccard', out.jaccard);
    }
  } catch {
    /* best-effort */
  }

  try {
    const sem = semanticFloorItems(db, items, modelId);
    if (sem && sem.items.length >= MIN_FLOOR_ITEMS) {
      const s = computeLinkFloor({ items: sem.items, similarityFn: sem.similarityFn });
      if (s) {
        out.semantic = {
          backend: 'semantic',
          corpusSize: sem.items.length,
          modelId: sem.modelId,
          computedAt,
          ...s,
        };
        writeLinkFloor(db, 'semantic', out.semantic);
      }
    }
  } catch {
    /* the semantic half is optional by construction */
  }
  return out;
}

/**
 * Build the semantic sample: the live bodies that ALREADY have a cached vector,
 * plus a cosine over those vectors. Returns null when the cache is absent (the
 * embedder was never installed / never synced) — the normal, non-error state.
 *
 * The lookup key comes from semantic-backend's own `embeddingCacheKey`, never a
 * second copy of `sha256(model\nbody)`: a silent divergence there would produce
 * an empty sample, i.e. no semantic floor, i.e. no semantic links — a failure
 * that looks exactly like "the embedder is not installed".
 */
function semanticFloorItems(db, items, modelIdOpt) {
  let cacheRows;
  try {
    cacheRows = db.prepare('SELECT content_sha, model, vector FROM embedding_cache').all();
  } catch {
    return null; // schema absent → semantic was never synced
  }
  if (!cacheRows || cacheRows.length === 0) return null;
  const modelId = modelIdOpt ?? cacheRows[0].model;
  const bySha = new Map();
  for (const r of cacheRows) {
    if (r.model !== modelId) continue;
    bySha.set(
      r.content_sha,
      new Float32Array(r.vector.buffer, r.vector.byteOffset, r.vector.byteLength / 4),
    );
  }
  if (bySha.size === 0) return null;
  const vecByText = new Map();
  const sampled = [];
  for (const it of items) {
    const v = bySha.get(embeddingCacheKey(modelId, it.text));
    if (!v) continue;
    vecByText.set(it.text, v);
    sampled.push(it);
  }
  return {
    modelId,
    items: sampled,
    similarityFn: (a, b) => cosineOf(vecByText.get(a), vecByText.get(b)),
  };
}

function cosineOf(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot; // vectors are stored L2-normalized → dot IS cosine
}

// --- Candidate selection + banding -----------------------------------------

/**
 * The candidate set for one tier, tokenized ONCE.
 *
 * The lexical backend is quadratic in tokenizations if each comparison
 * re-tokenizes the candidate body — 2,260 facts scored against 2,260 facts is
 * 5.1M tokenizations of the same 2,260 strings, which is the difference between
 * a backfill that finishes and one that does not. A caller scanning the corpus
 * repeatedly (the backfill) prepares this once and passes it in; a single write
 * lets `selectLinkCandidates` build it inline, where the cost is one pass.
 */
export function prepareLinkCandidates(db, { tier = null, now = Date.now(), lexical = true } = {}) {
  return liveFactRows(db, { tier, now }).map((r) => ({
    id: r.id,
    slug: slugForFactSource(r.source_file),
    body: r.body ?? '',
    trust: r.trust,
    tokens: lexical ? tokenSetOf(r.body ?? '') : null,
  }));
}

/**
 * Score `text` against the live same-tier corpus and split the result into the
 * three bands. Pure read — no writes, no side effects.
 *
 * @returns {{links:Array<{id,slug,score}>, nearDups:Array<{id,slug,score,body,trust}>,
 *            scanned:number, backend:string, floor:number, nearDupThreshold:number}}
 */
export function selectLinkCandidates({
  db,
  tier,
  text,
  excludeId = null,
  similarityFn: injectedSimilarityFn = null,
  backend = 'jaccard',
  floor,
  nearDupThreshold,
  cap = LINK_CAP,
  now = Date.now(),
  candidates = null,
} = {}) {
  const similarityFn = injectedSimilarityFn ?? tokenJaccardSimilarity;
  const empty = { links: [], nearDups: [], scanned: 0, backend, floor, nearDupThreshold };
  if (typeof text !== 'string' || !text.trim()) return empty;
  if (typeof floor !== 'number' || !Number.isFinite(floor)) return empty;

  // The LEXICAL fast path applies only when no similarityFn was injected: an
  // injected fn is the caller's contract (the semantic cosine, or a test seam)
  // and must be honored verbatim.
  const lexical = backend === 'jaccard' && !injectedSimilarityFn;
  const rows = candidates ?? prepareLinkCandidates(db, { tier, now, lexical });
  if (rows.length === 0 || rows.length > MAX_SCAN_FACTS) {
    return { ...empty, scanned: rows.length };
  }

  const newTokens = lexical ? tokenSetOf(text) : null;

  const scored = [];
  for (const r of rows) {
    if (excludeId && r.id === excludeId) continue;
    const body = r.body ?? '';
    if (!body.trim()) continue;
    let s;
    if (lexical && r.tokens) {
      // Cheap admissible bound first: token-Jaccard can never exceed
      // min(|A|,|B|)/max(|A|,|B|), so a length-mismatched candidate is rejected
      // without an intersection at all. (A cosine has no such bound, and the
      // dot product is already the cheap operation, so semantic skips this.)
      if (newTokens.size === 0 || r.tokens.size === 0) continue;
      const bound =
        Math.min(newTokens.size, r.tokens.size) / Math.max(newTokens.size, r.tokens.size);
      if (bound < floor) continue;
      s = jaccardOfTokenSets(newTokens, r.tokens);
    } else {
      try {
        s = similarityFn(text, body);
      } catch {
        continue;
      }
    }
    // `> 0` as well as `>= floor`: a derived floor CAN legitimately be 0 on a
    // corpus whose random pairs share nothing, and a zero-similarity edge is
    // not a relationship under any backend — it is the linker linking at random.
    if (!Number.isFinite(s) || s <= 0 || s < floor) continue;
    scored.push({ id: r.id, slug: r.slug, score: s, body, trust: r.trust });
  }

  // Deterministic order: score desc, then id asc so a tie never depends on
  // walk order (the corpus walk is already id-sorted, but ties must be pinned).
  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));

  const links = [];
  const nearDups = [];
  for (const c of scored) {
    if (typeof nearDupThreshold === 'number' && c.score >= nearDupThreshold) {
      nearDups.push(c);
      continue; // a near-dup NEVER consumes a link slot — different band, different treatment
    }
    if (links.length < cap) links.push({ id: c.id, slug: c.slug, score: c.score });
  }
  return { links, nearDups, scanned: rows.length, backend, floor, nearDupThreshold };
}


// --- The write-path boundary ------------------------------------------------

/**
 * The default near-dup ceiling per backend — Task 143's ALREADY-CALIBRATED
 * seam, reused rather than re-invented (grill Q1).
 */
export function nearDupThresholdFor(backend) {
  return backend === 'semantic' ? SEMANTIC_NEARDUP : SUBSTRING_NEARDUP_THRESHOLD;
}

/**
 * THE WRITE-PATH ENTRY POINT. Decide + apply linking for one fact.
 *
 * Called by `writeFact` (opportunistic attachment: linking runs where writes
 * already happen — no cron, no scheduled pass) and by the backfill.
 *
 * @param {object} opts
 * @param {import('better-sqlite3').Database} opts.db  an OPEN index db (caller owns it)
 * @param {string} opts.tier
 * @param {string} opts.id     the fact being written (excluded from its own candidates)
 * @param {string} opts.text   the fact BODY (linking never reads or rewrites it)
 * @param {'write'|'backfill'} [opts.mode='write']
 * @param {object} [opts.similarity]  { similarityFn, backend } — an injected
 *   prepared backend (the semantic path). Absent → token-Jaccard.
 * @returns {{related:string[], links:Array, nearDups:Array, queued:number,
 *            backend:string, floor:number|null, scanned:number}}
 */
export function autoLinkFact({
  db,
  projectRoot,
  userDir,
  tier,
  id,
  text,
  mode = 'write',
  similarity = null,
  now = null,
  candidates = null,
} = {}) {
  const backend = similarity?.backend ?? 'jaccard';
  const similarityFn = similarity?.similarityFn ?? tokenJaccardSimilarity;
  const none = { related: [], links: [], nearDups: [], queued: 0, mode, backend, floor: null, scanned: 0 };

  const floorRec = readLinkFloor(db, backend);
  if (!floorRec) return none; // no floor derived yet → write UNLINKED; backfill catches it
  const nearDupThreshold = nearDupThresholdFor(backend);
  // TWO degeneracy guards, both DERIVED (never a constant — grill Q3), both
  // answering "can this distribution separate a relationship from noise?":
  //
  //  (a) floor >= the calibrated near-dup ceiling — everything looks like
  //      everything, so the related band is EMPTY. Nothing to apply.
  //  (b) floor <= the random-pair MEDIAN — the p99 and the middle of the
  //      distribution coincide, so "top 1% of random pairs" is not a signal,
  //      it is the whole corpus. This is the D-433 dilution risk at its
  //      source: links minted from a flat distribution spend the reader's
  //      traversal budget on neighbours that mean nothing.
  //
  // In both cases linking NOTHING is the honest outcome — the fact still lands,
  // and a later backfill over a grown corpus re-decides.
  if (floorRec.floor >= nearDupThreshold) {
    return { ...none, floor: floorRec.floor, degenerate: 'floor-above-neardup' };
  }
  if (typeof floorRec.median === 'number' && floorRec.floor <= floorRec.median) {
    return { ...none, floor: floorRec.floor, degenerate: 'flat-distribution' };
  }

  const sel = selectLinkCandidates({
    db,
    tier,
    text,
    excludeId: id,
    similarityFn,
    backend,
    floor: floorRec.floor,
    nearDupThreshold,
    candidates,
  });

  // The near-dup band is a MERGE PROPOSAL, not a link and not a block: the fact
  // is captured either way (capture > linking) and a human decides in
  // `cmk queue conflicts`.
  //
  // BACKFILL NEVER QUEUES. In a backfill both facts already exist and were both
  // accepted, often months apart; manufacturing hundreds of retroactive merge
  // decisions the user never asked for would bury the queue's real signal.
  let queued = 0;
  if (mode === 'write' && sel.nearDups.length > 0) {
    const top = sel.nearDups[0];
    try {
      const r = writeConflictEntry({
        tier,
        projectRoot,
        userDir,
        newId: id,
        newText: text,
        newTrust: 'medium',
        existingId: top.id,
        existingText: top.body,
        existingTrust: top.trust ?? 'medium',
        similarity: top.score,
        similarityBackend: backend,
        detectedAt: now ?? nowIso(),
      });
      if (r.action === 'queued') queued = 1;
    } catch {
      /* best-effort: a queue hiccup must never fail the capture */
    }
  }

  return {
    related: sel.links.map((l) => l.slug),
    links: sel.links,
    nearDups: sel.nearDups,
    queued,
    mode,
    backend,
    floor: floorRec.floor,
    scanned: sel.scanned,
  };
}

/**
 * The Door-5 record for an applied auto-link: action, both ids, band, score,
 * backend, floor. Written AFTER the fact lands on disk, so an audit line always
 * describes a link that exists.
 */
export function auditAutoLink({ tierRoot, tier, id, decision, now = null }) {
  if (!decision || decision.links.length === 0) return;
  try {
    appendAuditEntry(tierRoot, {
      ts: now ?? nowIso(),
      action: 'auto-linked',
      tier,
      id,
      reasonCode: REASON_CODES.AUTO_LINKED,
      reasonText: `write-time linking: ${decision.links.length} related edge(s) via ${decision.backend} (floor=${decision.floor})`,
      extra: {
        // WHERE the edge came from, kept forever: an edge minted at capture and
        // one minted by a backfill months later have different provenance and a
        // reader (or a later audit) must be able to tell them apart.
        mode: decision.mode ?? 'write',
        backend: decision.backend,
        floor: decision.floor,
        scanned: decision.scanned,
        nearDups: decision.nearDups.length,
        queued: decision.queued,
        links: decision.links.map((l) => ({
          id: l.id,
          slug: l.slug,
          score: Number(l.score.toFixed(4)),
          band: 'related',
        })),
      },
    });
  } catch {
    /* the fact is already durably on disk */
  }
}

// --- The prepared (async) semantic linker ----------------------------------

/**
 * The SEMANTIC backend for scoring facts that are BOTH already in the corpus —
 * the backfill's shape, and a different problem from the write path's.
 *
 * THE BUG THIS EXISTS TO PREVENT (found by the sub-task-4 measurement, before
 * ship): `prepareSemanticSimilarity` embeds ONE incoming text and returns a
 * closure over THAT vector — its `similarityFn(a, b)` ignores `a` entirely and
 * scores `b` against the embedded text. That is exactly right for a capture
 * (one new text vs many candidates) and catastrophically wrong for a backfill,
 * where a single prepared scorer would compare every fact in the corpus against
 * whatever probe string happened to prepare it. The scores would be real
 * numbers, plausibly distributed, and meaningless — the worst failure shape
 * there is.
 *
 * So the backfill gets a SYMMETRIC scorer instead: both sides are looked up in
 * the content-addressed `embedding_cache` and compared by cosine. Every fact in
 * the corpus is already embedded there (that is what the semantic index IS), so
 * this makes ZERO model calls — it is cheaper than the capture path, not more
 * expensive.
 *
 * A pair where either side has no cached vector falls back to token-Jaccard for
 * that pair — the same honest per-pair degradation Task 143 chose, never a
 * throw and never a silent zero.
 *
 * @returns {{similarityFn:Function, backend:'semantic', modelId:string,
 *            coverage:number}|null}  null when nothing is cached (the embedder
 *            was never installed or never synced).
 */
export function makeCachedCosineBackend(db, { modelId: wantModel = null } = {}) {
  let rows;
  try {
    rows = db.prepare('SELECT content_sha, model, vector FROM embedding_cache').all();
  } catch {
    return null;
  }
  if (!rows || rows.length === 0) return null;
  const modelId = wantModel ?? rows[0].model;
  const bySha = new Map();
  for (const r of rows) {
    if (r.model !== modelId) continue;
    bySha.set(
      r.content_sha,
      new Float32Array(r.vector.buffer, r.vector.byteOffset, r.vector.byteLength / 4),
    );
  }
  if (bySha.size === 0) return null;

  // Memoized per-text lookup: a backfill scores the same candidate bodies once
  // per considered fact, so hashing each body every time would dominate.
  const vecOf = new Map();
  const lookup = (text) => {
    if (vecOf.has(text)) return vecOf.get(text);
    const v = bySha.get(embeddingCacheKey(modelId, text)) ?? null;
    vecOf.set(text, v);
    return v;
  };

  return {
    backend: 'semantic',
    modelId,
    coverage: bySha.size,
    similarityFn: (a, b) => {
      const va = lookup(a);
      const vb = lookup(b);
      if (!va || !vb) return tokenJaccardSimilarity(a, b);
      return cosineOf(va, vb);
    },
  };
}
