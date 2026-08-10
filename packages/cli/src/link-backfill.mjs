// link-backfill.mjs — Task 262 sub-task 3: link the corpus that already exists.
//
// Write-time linking (link-facts.mjs) only ever helps facts written from now
// on. The measurement that motivated the whole task is about the 2,220 facts
// ALREADY on disk, 96% of them unlinked. This is their pass.
//
// ADR-0020 GOVERNS ITS SHAPE — "if killed at 80%, does it persist the 80% and
// resume, or lose it?":
//   1. The smallest durable unit is ONE fact. Nothing is batched into a single
//      end-of-run write.
//   2. Each unit persists AS IT GOES — the `related:` frontmatter is written to
//      that one fact's file before the next fact is considered.
//   3. The RESUME POINT IS DERIVED FROM THE ARTIFACTS, not from a watermark
//      sidecar (the two-writer hazard ADR-0002 forbids). Two artifacts answer
//      "has this fact been considered?":
//        · its markdown carries `related:`             → it was LINKED;
//        · a `link_eval` row matches its content sha   → it was CONSIDERED and
//          had nothing above the floor.
//      `link_eval` lives in the REBUILDABLE index on purpose: losing it to a
//      full reindex costs a re-consideration, which is idempotent work — never
//      lost work, and never a second source of truth about the markdown.
//   4. Bounded per run (`max`), with `remaining` reported so a caller/cron
//      knows there is more.
//   5. Re-running is idempotent and safe: the markdown tier stays the truth.
//
// TWO THINGS IT DELIBERATELY DOES NOT DO:
//   · It never queues a near-dup to the conflict queue. In a backfill BOTH
//     facts already exist and were both accepted, often months apart;
//     manufacturing hundreds of retroactive merge decisions the user never
//     asked for would bury the queue's real signal under history.
//   · It never touches a fact that already carries `related:` — a hand-placed
//     or explicitly-passed edge is a human decision, and the backfill's job is
//     the blank ones.

import { readFileSync, writeFileSync } from 'node:fs';
import { resolveTierRoot, VALID_TIERS } from './tier-paths.mjs';
import { eachLiveFact } from './fact-store.mjs';
import { parse, format } from './frontmatter.mjs';
import { hashContent } from './content-hash.mjs';
import { openIndexDb } from './index-db.mjs';
import { reindexBoot } from './index-rebuild.mjs';
import { ERROR_CATEGORIES, errorResult } from './result-shapes.mjs';
import { nowIso } from './audit-log.mjs';
import {
  autoLinkFact,
  auditAutoLink,
  readLinkFloor,
  refreshLinkFloors,
  prepareLinkCandidates,
} from './link-facts.mjs';
// The `related:` normalizer is graph-index's — the SAME one rebuildEdges and
// vault-map read, so "does this fact already carry links?" can never disagree
// with "does this fact produce edges?".
import { relatedSlugs } from './graph-index.mjs';

/**
 * Facts considered per run.
 *
 * Sized against a real corpus rather than picked round: the dogfood repo has
 * ~2,260 facts and one evaluation is a bounded linear scan, so 250 is a run of
 * a few seconds — small enough to be an interruptible unit, large enough that a
 * full corpus finishes in ~9 runs rather than 200. The bound exists because
 * ADR-0020 requires one (a long job must not be all-or-nothing), not because
 * the work is expensive.
 */
export const BACKFILL_DEFAULT_MAX = 250;

/**
 * The resume marker table. Derived state in the rebuildable index (ADR-0002),
 * single-writer, keyed by the fact's STABLE id + the sha of the content that
 * was evaluated — so an EDITED fact is reconsidered automatically rather than
 * staying marked "nothing found" against text that no longer exists.
 */
export function ensureLinkEvalSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS link_eval (
      id TEXT PRIMARY KEY,
      content_sha TEXT NOT NULL,
      backend TEXT NOT NULL,
      evaluated_at TEXT NOT NULL
    );
  `);
}

/**
 * How many bounded batches a to-completion run will attempt beyond the number
 * the first batch's own arithmetic says it needs. The loop's real terminators
 * are "nothing remains" and "a batch made no progress"; this is the belt-and-
 * braces stop that keeps a pathological state (a fact that neither links nor
 * marks) from spinning forever instead of reporting honestly.
 */
const BATCH_HEADROOM = 2;

/** The candidate walk: every live fact in `tier` that has NOT been considered. */
function* pendingFacts({ projectRoot, userDir, tier, evaluated }) {
  for (const fact of eachLiveFact({ projectRoot, userDir, tiers: [tier] })) {
    // Artifact 1 — it already carries links (hand-placed, explicitly passed, or
    // written by a previous backfill). Never re-decided.
    if (relatedSlugs(fact.frontmatter?.related).length > 0) continue;
    const sha = hashContent(fact.body ?? '');
    // Artifact 2 — considered before, against THIS content.
    if (evaluated.get(fact.id) === sha) continue;
    yield { ...fact, contentSha: sha };
  }
}

function loadEvaluated(db) {
  const map = new Map();
  for (const row of db.prepare('SELECT id, content_sha FROM link_eval').all()) {
    map.set(row.id, row.content_sha);
  }
  return map;
}

/**
 * How many facts a backfill still has to consider. The same derivation the run
 * itself uses, exposed so a caller (a status line, a test, a cron) can ask
 * without doing the work.
 */
export function countLinkBackfillPending({ projectRoot, userDir, tier = 'P' } = {}) {
  const db = openIndexDb({ projectRoot });
  try {
    ensureLinkEvalSchema(db);
    const evaluated = loadEvaluated(db);
    let n = 0;
    for (const _ of pendingFacts({ projectRoot, userDir, tier, evaluated })) n++;
    return n;
  } finally {
    try {
      db.close();
    } catch {
      /* best-effort */
    }
  }
}

/**
 * Write `related:` onto ONE fact file, preserving every other byte of its
 * frontmatter and its body verbatim.
 *
 * The same in-place mutation shape as `write-fact.bumpRecurrence`: parse → set
 * one field → re-format.
 *
 * HONEST ABOUT WHAT THIS PRESERVES. It does NOT preserve every other byte: the
 * frontmatter is re-serialized by js-yaml, so key quoting/wrapping can shift
 * even where the value did not. What it DOES guarantee is semantic: every
 * frontmatter key keeps its value, `related` is the only key added or replaced,
 * and the BODY is passed through untouched — never reordered, re-wrapped or
 * rewritten. The over-mutation guarantee is therefore "this run touches only
 * the facts that earned links", which is what the tests assert; it is not a
 * byte-identity claim about the file that was edited.
 */
function applyRelated(path, slugs) {
  const parsed = parse(readFileSync(path, 'utf8'));
  if (!parsed.frontmatter) return false;
  parsed.frontmatter.related = slugs;
  writeFileSync(path, format(parsed), 'utf8');
  return true;
}

/**
 * Run one bounded, resumable backfill pass.
 *
 * @param {object} opts
 * @param {string} opts.projectRoot
 * @param {string} [opts.userDir]
 * @param {'P'|'L'|'U'} [opts.tier='P']
 * @param {number} [opts.max=BACKFILL_DEFAULT_MAX]
 * @param {boolean} [opts.dryRun=false]  report only — zero writes of any kind
 * @param {number} [opts.dryRunSkip=0]  DRY-RUN ONLY pagination cursor: skip
 *   this many pending facts before considering any. A wet run needs no cursor —
 *   every fact it considers leaves the pending walk through an artifact, so the
 *   next batch naturally starts after the last one. A dry run persists nothing,
 *   so without a cursor batch 2 would re-consider batch 1's facts forever. It is
 *   IGNORED when `dryRun` is false, because there it would silently skip facts
 *   the run is supposed to write.
 * @param {{similarityFn:Function, backend:string}} [opts.similarity]  the
 *   prepared semantic backend; absent → token-Jaccard.
 * @returns {{tier, backend, floor, evaluated, linked, edges, wouldLink,
 *            alreadyDone, remaining, nearDupBand, dryRun, samples}}
 */
export function linkBackfill({
  projectRoot,
  userDir,
  tier = 'P',
  max = BACKFILL_DEFAULT_MAX,
  dryRun = false,
  dryRunSkip = 0,
  similarity = null,
  now = null,
  sampleLimit = 10,
} = {}) {
  if (!VALID_TIERS.has(tier)) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: [`linkBackfill: tier must be one of P/U/L (got ${tier})`],
    });
  }
  const tierRoot = resolveTierRoot({ tier, projectRoot, userDir });
  const ts = now ?? nowIso();
  const backend = similarity?.backend ?? 'jaccard';

  const db = openIndexDb({ projectRoot });
  try {
    ensureLinkEvalSchema(db);
    // A backfill is allowed to be slow, so unlike the write path it DERIVES a
    // missing floor rather than giving up — this is the one place where paying
    // for the derivation is unambiguously the right trade.
    let floorRec = readLinkFloor(db, backend);
    if (!floorRec) {
      refreshLinkFloors(db, { now: ts });
      floorRec = readLinkFloor(db, backend);
    }

    const evaluated = loadEvaluated(db);
    const alreadyDone = evaluated.size;
    const markEval = db.prepare(
      `INSERT INTO link_eval (id, content_sha, backend, evaluated_at)
       VALUES (@id, @content_sha, @backend, @evaluated_at)
       ON CONFLICT(id) DO UPDATE SET content_sha = excluded.content_sha,
                                     backend = excluded.backend,
                                     evaluated_at = excluded.evaluated_at`,
    );

    // ONE tokenized pass over the corpus for the whole run. Without it each of
    // the (up to `max`) facts would re-tokenize every candidate body, which on a
    // 2,260-fact corpus is millions of tokenizations of the same strings — the
    // difference between a backfill that finishes and one that does not.
    //
    // Safe to hoist: linking writes only `related:` FRONTMATTER, so no body this
    // run touches can change while the run is in flight.
    const candidates = prepareLinkCandidates(db, { tier, lexical: !similarity });
    // Score the INDEXED body, not the file body.
    //
    // They differ: the indexer trims, while a fact file's body carries the
    // leading/trailing newlines writeFact wrote. Everything downstream is keyed
    // on the indexed form — the candidate bodies here, and (load-bearing) the
    // content-addressed `embedding_cache`, whose key is sha256(model + the
    // INDEXED body). Passing the file body meant every semantic lookup missed,
    // every pair silently fell back to token-Jaccard, and those lexical scores
    // were then judged against a SEMANTIC floor of 0.68 — so `--semantic`
    // produced exactly zero links while reporting a healthy floor. Found by the
    // sub-task-4 measurement, which is the only place it was visible.
    const indexedBody = new Map(candidates.map((c) => [c.id, c.body]));

    const bands = { related: 0, nearDup: 0, none: 0 };
    const samples = [];
    const failures = [];
    let considered = 0;
    let linked = 0;
    let edges = 0;
    let wouldEdges = 0;

    const skip = dryRun ? Math.max(0, Math.trunc(dryRunSkip) || 0) : 0;
    let cursor = 0;

    for (const fact of pendingFacts({ projectRoot, userDir, tier, evaluated })) {
      if (cursor++ < skip) continue;
      if (considered >= max) break;
      considered += 1;

      const decision = autoLinkFact({
        db,
        projectRoot,
        userDir,
        tier,
        id: fact.id,
        text: indexedBody.get(fact.id) ?? fact.body,
        mode: 'backfill',
        similarity,
        now: ts,
        candidates,
      });

      if (decision.nearDups.length > 0) bands.nearDup += 1;

      if (decision.related.length > 0) {
        bands.related += 1;
        wouldEdges += decision.related.length;
        // `linked`/`edges` are incremented after the write lands (M7) — see the
        // apply block below. In a dry run they are counted via `wouldLink`.
        if (samples.length < sampleLimit) {
          samples.push({
            id: fact.id,
            title: fact.frontmatter?.title ?? null,
            links: decision.links.map((l) => ({ slug: l.slug, score: Number(l.score.toFixed(4)) })),
          });
        }
        if (!dryRun) {
          // PERSIST AS YOU GO (ADR-0020 rule 2): this fact's links are durable
          // before the next fact is considered, so a kill here keeps everything
          // already done.
          //
          // PER-FACT BEST-EFFORT (M8): one unwritable file — EBUSY from a
          // virus scanner, EPERM, or a fact deleted between the walk and the
          // write — must not abort a 250-fact run and lose the 249 that
          // worked. Skip it, count it, report it.
          //
          // The counters move only AFTER the write succeeds (M7), so `linked`
          // and `edges` describe what is on disk rather than what was
          // attempted. A fact whose write failed is recorded as EVALUATED so
          // the resume walk does not spin on it forever; its content sha means
          // an edit still brings it back.
          let applied = false;
          try {
            applied = applyRelated(fact.path, decision.related);
          } catch (err) {
            applied = false;
            failures.push({ id: fact.id, error: String(err?.code ?? err?.message ?? err) });
          }
          if (applied) {
            linked += 1;
            edges += decision.related.length;
            auditAutoLink({
              tierRoot,
              tier,
              id: fact.id,
              decision: { ...decision, mode: 'backfill' },
              now: ts,
            });
          } else {
            markEval.run({ id: fact.id, content_sha: fact.contentSha, backend, evaluated_at: ts });
          }
        }
      } else {
        bands.none += 1;
        if (!dryRun) {
          // The "considered, nothing above the floor" artifact — the half of
          // the resume point the markdown cannot express.
          markEval.run({ id: fact.id, content_sha: fact.contentSha, backend, evaluated_at: ts });
        }
      }
    }

    // `remaining` is re-derived from the artifacts, not counted down from a
    // total — the same derivation the next run will use, so the two can never
    // disagree.
    const afterEval = dryRun ? evaluated : loadEvaluated(db);
    let remaining = 0;
    for (const _ of pendingFacts({ projectRoot, userDir, tier, evaluated: afterEval })) remaining++;
    // A dry run leaves no artifact, so the walk still yields everything it just
    // looked at: subtract what THIS batch considered AND what earlier batches
    // of the same dry run skipped past.
    if (dryRun) remaining = Math.max(0, remaining - considered - skip);

    return {
      tier,
      backend,
      floor: floorRec?.floor ?? null,
      evaluated: considered,
      // `linked`/`edges` count WRITES THAT LANDED; `wouldLink`/`wouldAddEdges`
      // count facts that cleared the floor, which is the dry run's answer and
      // also the honest denominator when some writes failed.
      linked,
      wouldLink: bands.related,
      edges,
      wouldAddEdges: bands.related > 0 ? wouldEdges : 0,
      failed: failures.length,
      failures: failures.slice(0, 10),
      alreadyDone,
      remaining,
      nearDupBand: bands.nearDup,
      bands,
      dryRun,
      samples,
    };
  } finally {
    try {
      db.close();
    } catch {
      /* best-effort */
    }
  }
}

/**
 * Bring the search index back in step after a backfill wrote links.
 *
 * WHY THIS IS IN-BAND. Every index READER already lazy-reindexes (`withReadDb`,
 * the viewer, the MCP server), so the edges would eventually appear on their
 * own — but "eventually, if you happen to read through the right surface" is
 * not what a user who just ran a write command is owed, and the observable
 * result was a human being told to type `cmk reindex --boot` afterwards. That
 * is plumbing, and D-85 says the action completes automatically: the regular
 * user runs no follow-up command. Same contract, same idiom as `forget()`'s
 * in-band reindex (forget.mjs) and `redact()`'s.
 *
 * WHY `reindexBoot` AND NOT THE NARROWER `rebuildEdges`. `rebuildEdges` is not
 * actually narrower — it walks the whole fact corpus regardless — and calling
 * it alone would leave the `files` mtime/sha1 checkpoint stale for exactly the
 * files this run rewrote, so the next reader pays for re-parsing them anyway.
 * `reindexBoot` IS the incremental one: it re-parses only the changed files and
 * then rebuilds the edges itself because they changed. One call, both halves,
 * and it is the primitive `cmk reindex --boot` runs.
 *
 * BEST-EFFORT BY CONSTRUCTION: the markdown is the truth and it is already
 * written. An index failure must never turn a successful backfill into an
 * error — it degrades to the self-heal every reader already performs.
 *
 * @returns {{synced: boolean, edgeCount: number, filesReindexed: number, error?: string}}
 */
export function syncIndexAfterBackfill({ projectRoot, userDir } = {}) {
  if (!projectRoot) return { synced: false, edgeCount: 0, filesReindexed: 0 };
  try {
    const db = openIndexDb({ projectRoot });
    try {
      const r = reindexBoot({ projectRoot, userDir, db });
      return {
        synced: true,
        edgeCount: r?.edgeCount ?? 0,
        filesReindexed: r?.filesReindexed ?? 0,
      };
    } finally {
      try {
        db.close();
      } catch {
        /* best-effort */
      }
    }
  } catch (err) {
    return {
      synced: false,
      edgeCount: 0,
      filesReindexed: 0,
      error: String(err?.message ?? err),
    };
  }
}

/**
 * Run bounded batches until the corpus is finished — ONE invocation does the
 * whole job.
 *
 * THE BOUND IS A RECOVERY PROPERTY, NOT A UX. ADR-0020 requires that a long job
 * killed at 80% has persisted the 80% and can resume; it does NOT require that
 * a human be the loop driver. The first shipped version printed "1,895 fact(s)
 * remain — re-run to continue", which leaked the internal property into the
 * interface and asked the user to turn a crank the machine knows how to turn.
 *
 * WHAT IS UNCHANGED: every batch is a `linkBackfill` call, byte for byte the
 * same durable unit as before — one fact at a time, each persisted before the
 * next is considered, the resume point derived from the artifacts. Kill this
 * loop at any moment and you keep everything the finished batches did, and the
 * next invocation continues from the same artifacts. The loop adds iteration;
 * it does not add a transaction, a sidecar, or a window in which work is held.
 *
 * The dry run loops too — otherwise a first look at a 2,000-fact corpus would
 * report the first 250 and call it the picture — using `dryRunSkip` as its
 * cursor, since a dry run persists nothing to advance the walk with.
 *
 * @param {object} opts  as `linkBackfill`, except `max` → `batchSize`
 * @param {number} [opts.batchSize=BACKFILL_DEFAULT_MAX]  facts per durable batch
 * @param {(progress:object)=>void} [opts.onBatch]  called after each batch lands
 * @returns aggregated `linkBackfill` result + `{batches, stopped}`
 */
export function linkBackfillToCompletion({
  projectRoot,
  userDir,
  tier = 'P',
  batchSize = BACKFILL_DEFAULT_MAX,
  dryRun = false,
  similarity = null,
  now = null,
  sampleLimit = 10,
  onBatch = null,
} = {}) {
  let agg = null;
  let batches = 0;
  let stopped = 'complete';
  let dryRunSkip = 0;
  let batchCap = Infinity;
  let prevRemaining = Infinity;

  for (;;) {
    const r = linkBackfill({
      projectRoot,
      userDir,
      tier,
      max: batchSize,
      dryRun,
      dryRunSkip,
      similarity,
      now,
      sampleLimit,
    });
    // A malformed request fails the same way it always did — on the first batch,
    // before anything is written.
    if (r.action === 'error') return r;
    batches += 1;

    if (agg === null) {
      agg = {
        ...r,
        bands: { ...r.bands },
        failures: [...r.failures],
        samples: [...r.samples],
      };
      // Batches this run could possibly need, from the first batch's own
      // arithmetic (`evaluated + remaining` is the corpus it has to get
      // through), plus headroom.
      const totalWork = r.evaluated + r.remaining;
      batchCap = Math.ceil(Math.max(1, totalWork) / Math.max(1, batchSize)) + BATCH_HEADROOM;
    } else {
      agg.evaluated += r.evaluated;
      agg.linked += r.linked;
      agg.edges += r.edges;
      agg.wouldLink += r.wouldLink;
      agg.wouldAddEdges += r.wouldAddEdges;
      agg.failed += r.failed;
      agg.nearDupBand += r.nearDupBand;
      for (const k of Object.keys(agg.bands)) agg.bands[k] += r.bands[k];
      for (const f of r.failures) if (agg.failures.length < 10) agg.failures.push(f);
      for (const s of r.samples) if (agg.samples.length < sampleLimit) agg.samples.push(s);
      // `remaining` is always the LATEST derivation, never a running total.
      agg.remaining = r.remaining;
      // `alreadyDone` describes the state this whole run INHERITED, so it stays
      // the first batch's — later batches would report our own progress back to
      // us as if an earlier session had done it.
    }

    onBatch?.({
      batch: batches,
      dryRun,
      evaluated: r.evaluated,
      linked: dryRun ? r.wouldLink : r.linked,
      edges: dryRun ? r.wouldAddEdges : r.edges,
      remaining: r.remaining,
      totalEvaluated: agg.evaluated,
      totalLinked: dryRun ? agg.wouldLink : agg.linked,
    });

    // Terminators, in the order they can fire.
    if (r.floor == null) break; // nothing is linkable at all — do not spin
    if (r.remaining <= 0) break; // done
    if (r.evaluated === 0) {
      // The walk yielded nothing while claiming work remains. Not a state we
      // can make progress from, so stop and let the caller report it honestly
      // rather than loop on it.
      stopped = 'stalled';
      break;
    }
    if (r.remaining >= prevRemaining) {
      stopped = 'stalled';
      break;
    }
    prevRemaining = r.remaining;
    if (batches >= batchCap) {
      stopped = 'batch-cap';
      break;
    }
    if (dryRun) dryRunSkip += r.evaluated;
  }

  return { ...agg, batches, stopped };
}
