#!/usr/bin/env node
// Task 262 sub-task 1 — the RELATIONAL recall benchmark, and the canary that
// licenses it to measure anything at all.
//
//   npm run bench:linking                  → canary, then the full baseline matrix
//   npm run bench:linking -- --canary-only  → just the sensitivity proof
//   npm run bench:linking -- --aged=false   → skip the aged half (faster; NOT the gate)
//
// WHY THIS EXISTS. ADR-0023 DEFERRED LLM edge derivation behind a NAMED trigger:
// *extend the Task-99 benchmark with a relational/multi-hop question type; if
// flat hybrid scores materially below the exact/paraphrase types on it, the
// numbers decide.* Task 262 resolves that DEFER by firing the trigger rather
// than by argument. This script is the trigger's instrument, and the run it
// produces on the UNLINKED corpus is the BEFORE half of the before/after that
// write-time linking is judged on.
//
// WHAT IT MEASURES, precisely. Four question types (the LoCoMo + LongMemEval
// taxonomy both papers in the 2026-08-07 research break benchmark on):
//
//   multi-hop   THE measured type. The answer fact shares no distinctive term
//               with the query; it is reachable only by following a `related:`
//               edge out of the fact the query DOES match.
//   temporal    CONTROL. Reachable by walking `superseded_by`, which is not a
//               `related:` edge and survives the unlinked twin untouched. If a
//               margin shows up HERE, the benchmark is measuring traversal in
//               general, not linking — the false positive this control catches.
//   single-hop  CONTROL. Flat-answerable. Traversal must not push a true answer
//               out of the top 5; a graph pipeline that wins multi-hop by
//               losing single-hop has not won.
//   preference  the same control on the user tier.
//
// THE CANARY (KiroCrew auto_improvement, D-429). Before measuring whether
// linking helps, prove the instrument can detect a KNOWN win: a hand-linked
// corpus must beat its byte-identical unlinked twin on multi-hop by more than
// CANARY_MIN_MARGIN. If it does not, the harness cannot measure and the run
// HALTS — a benchmark that cannot see a hand-placed edge would report the
// automatic ones as noise, and we would "learn" that linking does not work.
// The canary is not a test of linking. It is a test of the ruler.
//
// AGED, NOT ONLY FRESH (Task 261 / D-421 class). A fresh corpus numbers every
// derived table in insert order, so it agrees with its source by luck. The
// aged half drives the REAL `cmk` bins through write / forget / supersede /
// unlink / reindex --boot / reindex --full before it measures, and asserts the
// labelled corpus survived — a number taken over a corpus the aging ate would
// be worse than no number.
//
// HONEST LIMIT, stated up front because it bounds every conclusion drawn from
// this script: the multi-hop questions are constructed so their answers are
// link-only-reachable. That makes the canary a real detector, and it makes the
// LINKED column a CEILING — "if the right edge exists, recall improves by this
// much". Whether write-time linking actually produces the right edges is a
// different question, and it is the one sub-task 2's re-measurement answers.

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  aggregate,
  buildSubQueries,
  fuseRankings,
  ndcgAtK,
  recallAtK,
  seedCorpus,
} from './bench-recall.mjs';
import { createAgedSandbox, installKit } from './lib/aged-corpus.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
import { search, SEARCH_MODES } from '../packages/cli/src/search.mjs';
import { prepareSemanticBackend } from '../packages/cli/src/semantic-backend.mjs';
import { traverseLinks } from '../packages/cli/src/graph-index.mjs';
import { reindexBoot } from '../packages/cli/src/index-rebuild.mjs';
import { linkBackfill } from '../packages/cli/src/link-backfill.mjs';
import { makeCachedCosineBackend } from '../packages/cli/src/link-facts.mjs';
import { eachFact } from '../packages/cli/src/fact-store.mjs';
import { ID_PATTERN } from '../packages/cli/src/tier-paths.mjs';
import {
  parse as parseFrontmatter,
  format as formatFrontmatter,
} from '../packages/cli/src/frontmatter.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');
const DEFAULT_CORPUS = join(REPO_ROOT, 'fixtures', 'link-bench', 'corpus.json');
const DEFAULT_QUERIES = join(REPO_ROOT, 'fixtures', 'link-bench', 'queries.json');

export const LINK_QTYPES = Object.freeze(['single-hop', 'multi-hop', 'temporal', 'preference']);

/**
 * The four corpus variants.
 *
 *   linked          the hand-placed edges — the CEILING, and the canary's
 *                   positive control.
 *   unlinked        the byte-identical twin with every `related:` removed —
 *                   the BEFORE, and the honest stand-in for the real corpus.
 *   auto-write      edges placed by WRITE-TIME linking as the corpus is built,
 *                   with the index refreshed between writes. Structurally
 *                   BACKWARD-ONLY: a fact can only ever link to what already
 *                   existed when it was written, which is the real constraint
 *                   of the write path, not a limitation of this harness.
 *   auto-backfill   edges placed by `cmk autolink` over the finished corpus —
 *                   symmetric, every fact sees every other. This is what an
 *                   EXISTING corpus (the 2,220 facts the task is about) gets.
 *
 * Measuring both auto variants separately is the point: they answer different
 * questions and they are the two halves of what actually ships.
 */
export const VARIANTS = new Set(['linked', 'unlinked', 'auto-write', 'auto-backfill']);

/** The qtype the canary measures, and the metric it measures it on. */
export const CANARY_QTYPE = 'multi-hop';
export const CANARY_METRIC = 'r@5';

/**
 * The margin a hand-linked corpus must beat its unlinked twin by before the
 * benchmark is allowed to measure anything.
 *
 * 0.30 on R@5, chosen against the resolution of the question set rather than
 * picked round: the multi-hop set has 9 questions, so one question is worth
 * 0.111. A floor of 0.30 demands the linked run recover at least THREE more
 * answers than the unlinked one — comfortably past any single-question wobble,
 * while staying well under the ~0.7 the constructed set can produce, so the
 * floor is a detector and not a restatement of the expected result.
 */
export const CANARY_MIN_MARGIN = 0.3;

// Read-time traversal breadth. Deliberately NOT the write-time cap-3 (the
// 2026-08-04 link-cap research §3: "separate write-cap from browse-breadth" —
// breadth at read time costs nothing at write time). Five seeds expanded five
// neighbours deep-2 is the bounded budget an agent would actually spend.
const GRAPH_SEEDS = 5;
const GRAPH_NEIGHBOURS_PER_SEED = 5;
const GRAPH_DEFAULT_DEPTH = 2;

// --- The unlinked twin ------------------------------------------------------

/**
 * The corpus with every `related:` list removed and NOTHING else changed —
 * the twin the canary compares against.
 *
 * Pure: the caller's parsed corpus is never mutated, because both variants are
 * usually derived from one parse in one process and a mutating strip would
 * silently poison whichever run came second.
 */
export function stripLinks(corpus) {
  return {
    ...corpus,
    entries: corpus.entries.map((e) => {
      const { related: _dropped, ...rest } = e;
      return rest;
    }),
  };
}

// --- The relational pipeline ------------------------------------------------

function searchIds({ db, query, limit }) {
  const r = search({ db, query, mode: SEARCH_MODES.KEYWORD, limit });
  if (r.action === 'error') return [];
  return r.results.map((hit) => hit.id);
}

/**
 * The traversal operator: the ids reachable from `seedIds` within `depth` hops,
 * in either direction, excluding the seeds themselves.
 *
 * Non-file nodes are dropped — a dangling `related:` slug and a `cites`
 * anchor hub (`anchor:D-361`) are both real edges but neither is a fact that
 * can answer a question, so admitting them would inflate the candidate list
 * with things no metric can ever credit.
 *
 * Deterministic: `traverseLinks` orders by (depth, type, src, dst) per
 * direction, and seeds are walked in rank order.
 */
export function expandByLinks(db, seedIds, { depth = GRAPH_DEFAULT_DEPTH, perSeed = GRAPH_NEIGHBOURS_PER_SEED } = {}) {
  const seen = new Set(seedIds);
  const out = [];
  for (const seed of seedIds) {
    let taken = 0;
    for (const row of traverseLinks(db, seed, { depth, direction: 'both' })) {
      if (taken >= perSeed) break;
      const neighbour = row.direction === 'in' ? row.from_id : row.to_id;
      if (!ID_PATTERN.test(neighbour) || seen.has(neighbour)) continue;
      seen.add(neighbour);
      out.push(neighbour);
      taken += 1;
    }
  }
  return out;
}

// Rung 0b (Task 99): the deterministic emulation of an agent iterating on
// keywords — the full query plus each content token, RRF-fused.
//
// THIS is the flat comparator, not raw `keyword`, and the reason is measured
// rather than assumed: the kit's FTS5 path is a strict AND over query terms, so
// a natural-language question ("what package manager do we use") matches
// NOTHING even when the answering fact is sitting in the corpus. Seeding a
// traversal from a pipeline that returns zero rows would make the graph rung
// look broken for a reason that has nothing to do with links, and would make
// the canary compare 0 against 0. ADR-0023's deferral trigger names "flat
// hybrid + the agentic ladder" as the thing relational recall must be measured
// against, so the ladder is the floor the graph rung has to beat.
function agenticIds({ db, query, limit }) {
  const lists = buildSubQueries(query).map((sq) => searchIds({ db, query: sq, limit }));
  return fuseRankings(lists).slice(0, limit);
}

// The kit's DEFAULT shipped recall — FTS5 + sqlite-vec fused by RRF. Named by
// ADR-0023's deferral trigger as the thing relational recall must be measured
// against ("if flat hybrid + the agentic ladder scores materially below…"), so
// leaving it unmeasured would leave the trigger half-fired. Opt-in (`--semantic`)
// rather than default because it needs the local ONNX embedder present, and the
// committed default run must stay reproducible on a machine without it.
async function hybridIds({ db, query, limit, modelId }) {
  const prep = await prepareSemanticBackend({ db, query, ...(modelId ? { modelId } : {}) });
  if (!prep.ok) throw new Error(`semantic backend unavailable: ${prep.reason}`);
  const r = search({ db, query, mode: SEARCH_MODES.HYBRID, semanticBackend: prep.backend, limit });
  return r.action === 'error' ? [] : r.results.map((h) => h.id);
}

// Each pipeline: async ({db, query, limit, depth}) → ranked id list.
const PIPELINES = {
  // Raw one-shot FTS5 — reported as the floor, and as the evidence for why the
  // agentic rung is the honest comparator.
  keyword: async ({ db, query, limit }) => searchIds({ db, query, limit }),
  agentic: async ({ db, query, limit }) => agenticIds({ db, query, limit }),
  // The relational rung: agentic seeds, then one bounded traversal, fused with
  // the kit's own RRF convention (k=60, equal weight — the same fusion
  // `search.mjs` uses for keyword+semantic, so the benchmark does not invent a
  // third one).
  graph: async ({ db, query, limit, depth }) => {
    const seeds = agenticIds({ db, query, limit });
    const neighbours = expandByLinks(db, seeds.slice(0, GRAPH_SEEDS), { depth });
    return fuseRankings([seeds, neighbours]).slice(0, limit);
  },
  hybrid: async ({ db, query, limit, modelId }) => hybridIds({ db, query, limit, modelId }),
  // The same traversal, seeded from the kit's real default recall instead of
  // the keyword ladder — the honest "what would shipping this actually buy".
  'graph-hybrid': async ({ db, query, limit, depth, modelId }) => {
    const seeds = await hybridIds({ db, query, limit, modelId });
    const neighbours = expandByLinks(db, seeds.slice(0, GRAPH_SEEDS), { depth });
    return fuseRankings([seeds, neighbours]).slice(0, limit);
  },
};

/**
 * Run `fn` with write-time linking force-ENABLED, whatever the shipped default.
 *
 * The benchmark measures the MECHANISM, not the default. Since D-436 the
 * default is OFF, and `writeFact` consults `linkingEnabled()` independently of
 * `seedCorpus({autoLink:true})` — so without this the auto-write arm seeds a
 * corpus with zero edges and scores identically to the unlinked control, while
 * still being labelled `auto-write`. That is the worst failure shape a
 * benchmark has: an arm that quietly measures nothing and reports a number.
 * (It is not hypothetical — it is what this harness did between the default
 * flip and the B2 review finding, and the assertion in `runLinkBench` now makes
 * it impossible to repeat silently.)
 */
async function withLinkingEnabled(fn) {
  const prev = process.env.CMK_LINK_FACTS;
  process.env.CMK_LINK_FACTS = '1';
  try {
    return await fn();
  } finally {
    if (prev === undefined) delete process.env.CMK_LINK_FACTS;
    else process.env.CMK_LINK_FACTS = prev;
  }
}

// --- Aging ------------------------------------------------------------------

const DRIFT_MARKER = 'BENCH-DRIFT';
const DRIFT_FACTS = 8;

/** The drift facts written by the aging pass, read straight off disk. */
function driftFacts({ projectRoot, userDir }) {
  const out = [];
  for (const fact of eachFact({ projectRoot, userDir })) {
    if (fact.body.includes(DRIFT_MARKER)) out.push(fact);
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * build → MUTATE → rebuild, driven by the REAL `cmk` bins (Task 261's harness
 * discipline: the aging is the half that must not be simulated, because it is
 * the half that re-numbers rows).
 *
 * Every mutation targets a DRIFT fact this function wrote itself — never a
 * labelled one. That is not politeness: a benchmark whose ground truth the
 * aging deleted would report a recall collapse that is really a fixture bug,
 * which is exactly the kind of confident wrong number this task exists to
 * avoid. `mutatedLabelledKeys` in the report is the receipt.
 */
function ageBenchCorpus({ sandbox, labelledIds, onCommand }) {
  const run = (args, opts) => {
    onCommand?.(args);
    return sandbox.cmk(args, opts);
  };
  const { projectRoot, userDir } = sandbox;
  const labelled = new Set(labelledIds);
  const mutatedLabelledKeys = [];
  const guard = (id, what) => {
    if (labelled.has(id)) mutatedLabelledKeys.push(`${what}:${id}`);
    return !labelled.has(id);
  };

  // 1. WRITE — new rows, which shift every auto-assigned number after them.
  for (let i = 0; i < DRIFT_FACTS; i++) {
    run([
      'remember', `${DRIFT_MARKER} ${i}: an unrelated capture made while the corpus aged.`,
      '--title', `Drift note ${i}`,
      '--why', 'Written by the linking benchmark to age the corpus before measuring.',
      '--type', 'project',
    ]);
  }
  // 2. EXPIRE — a row that stops being live without being deleted.
  run([
    'remember', `${DRIFT_MARKER} lapsed: a time-boxed note that has already expired.`,
    '--title', 'Drift note lapsed',
    '--why', 'Exercises the expired-but-present branch of the live set.',
    '--type', 'project',
    '--expires', '2020-01-01',
  ], { allowFail: true });

  const drift = driftFacts({ projectRoot, userDir });
  let tombstoned = 0;
  let superseded = 0;
  let unlinked = 0;

  // 3. FORGET — rows that move to the tombstone surface.
  for (const f of drift.slice(0, 2)) {
    if (!guard(f.id, 'forget')) continue;
    run(['forget', f.id, '--yes', '--reason', 'aged by the linking benchmark'], { allowFail: true });
    tombstoned += 1;
  }
  // 4. SUPERSEDE — the on-disk shape, written straight into frontmatter.
  if (drift.length >= 4 && guard(drift[2].id, 'supersede')) {
    const parsed = parseFrontmatter(readFileSync(drift[2].path, 'utf8'));
    parsed.frontmatter.superseded_by = drift[3].id;
    writeFileSync(drift[2].path, formatFrontmatter(parsed), 'utf8');
    superseded += 1;
  }
  // 5. UNLINK — the hand-`rm` of a fact file, which shifts everything after it.
  if (drift.length >= 5 && guard(drift[4].id, 'unlink')) {
    rmSync(drift[4].path, { force: true });
    unlinked += 1;
  }

  // 6 + 7. The incremental pass, then the pass that DROPs and re-numbers.
  run(['reindex', '--boot']);
  run(['reindex', '--full']);

  return {
    driftWritten: drift.length,
    tombstoned,
    superseded,
    unlinked,
    mutatedLabelledKeys,
  };
}

// --- The runner -------------------------------------------------------------

function scoreQuery(rankedIds, relevantSet) {
  return {
    'r@5': recallAtK(rankedIds, relevantSet, 5),
    'r@10': recallAtK(rankedIds, relevantSet, 10),
    'ndcg@10': ndcgAtK(rankedIds, relevantSet, 10),
  };
}

/**
 * One measurement: seed a variant of the corpus, index it, optionally age it,
 * then run every query through one pipeline.
 *
 * @returns the report object (also written to `outPath` when given).
 */
export async function runLinkBench({
  corpusPath = DEFAULT_CORPUS,
  queriesPath = DEFAULT_QUERIES,
  variant = 'linked',
  pipeline = 'graph',
  depth = GRAPH_DEFAULT_DEPTH,
  aged = false,
  modelId = null,
  // Which backend the LINKER scores with (independent of which PIPELINE the
  // recall is measured on — a corpus can be linked lexically and read back
  // semantically, and both combinations ship).
  linkBackend = 'jaccard',
  sandboxRoot = null,
  outPath = null,
  quiet = false,
  onCommand = null,
} = {}) {
  const pipelineFn = PIPELINES[pipeline];
  if (!pipelineFn) {
    throw new Error(
      `unknown pipeline '${pipeline}' — available: ${Object.keys(PIPELINES).join(', ')}`,
    );
  }
  if (!VARIANTS.has(variant)) {
    throw new Error(`unknown variant '${variant}' — available: ${[...VARIANTS].join(', ')}`);
  }

  const parsed = JSON.parse(readFileSync(corpusPath, 'utf8'));
  // Every variant except `linked` starts from the corpus with its hand-placed
  // edges REMOVED. `unlinked` stays that way (the BEFORE); the two `auto-*`
  // variants let the shipped mechanism put edges back, which is the whole
  // question — how close does an automatic linker get to hand-placed ones.
  const corpus = variant === 'linked' ? parsed : stripLinks(parsed);
  const queries = JSON.parse(readFileSync(queriesPath, 'utf8'));

  // The aged path needs the REAL bins on PATH and an isolated user tier, so it
  // borrows Task 261's sandbox wholesale rather than growing a second one.
  const agedSandbox = aged ? createAgedSandbox({ prefix: 'cmk-linkbench-aged-' }) : null;
  const ownSandbox = !aged && sandboxRoot == null;
  const root = aged ? agedSandbox.root : (sandboxRoot ?? mkdtempSync(join(tmpdir(), 'cmk-linkbench-')));
  const projectRoot = aged ? agedSandbox.projectRoot : join(root, 'bench-proj');
  const userDir = aged ? agedSandbox.userDir : join(root, 'bench-user');
  if (!aged) mkdirSync(projectRoot, { recursive: true });

  let db;
  try {
    if (aged) {
      // Recorded like every other real-bin call — `installKit` reaches
      // `sandbox.cmk` directly, so without this the command trace would omit
      // the one subprocess that creates the tiers everything else writes into.
      onCommand?.(['install', '--no-hooks']);
      installKit(agedSandbox);
    }
    // `auto-write` refreshes the SQLite index between writes so each fact is
    // scored against the corpus that existed BEFORE it — the honest simulation
    // of a session where captures interleave with reads (reindexBoot is what
    // every search already runs). Without it the index stays empty for the
    // whole seed and the write-time linker correctly links nothing, which
    // would measure the harness rather than the mechanism.
    let seedDb = null;
    const onFactWritten =
      variant === 'auto-write'
        ? () => {
            if (!seedDb) seedDb = openIndexDb({ projectRoot });
            reindexBoot({ projectRoot, userDir, db: seedDb });
          }
        : null;
    // `autoLink` clears writeFact's opt-out; `withLinkingEnabled` turns the
    // mechanism ON over the shipped default-OFF. BOTH are required.
    const seed = () =>
      seedCorpus({
        corpus,
        projectRoot,
        userDir,
        sourceFile: 'fixtures/link-bench/corpus.json',
        autoLink: variant === 'auto-write',
        onFactWritten,
      });
    const keyToId = variant === 'auto-write' ? await withLinkingEnabled(seed) : seed();
    try {
      seedDb?.close();
    } catch {
      /* best-effort */
    }

    // `auto-backfill` runs the SHIPPED verb's core over the finished corpus:
    // index it, then let `linkBackfill` consider every fact exactly as
    // `cmk autolink` would.
    let backfill = null;
    if (variant === 'auto-backfill') {
      const bfDb = openIndexDb({ projectRoot });
      let similarity = null;
      try {
        reindexFull({ projectRoot, userDir, db: bfDb });
        if (linkBackend === 'semantic') {
          // Sync the vectors first, then score from the CACHE on both sides —
          // the capture-path scorer would compare the whole corpus against one
          // probe (see makeCachedCosineBackend). Zero model calls after sync.
          const prep = await prepareSemanticBackend({ db: bfDb, query: 'link', ...(modelId ? { modelId } : {}) });
          if (!prep.ok) throw new Error(`semantic link backend unavailable: ${prep.reason}`);
          similarity = makeCachedCosineBackend(bfDb, modelId ? { modelId } : {});
          if (!similarity) throw new Error('semantic link backend: no vectors cached after sync');
        }
      } finally {
        bfDb.close();
      }
      backfill = linkBackfill({ projectRoot, userDir, tier: 'P', max: 10000, similarity });
    }

    let aging = null;
    if (aged) {
      aging = ageBenchCorpus({
        sandbox: agedSandbox,
        labelledIds: [...keyToId.values()],
        onCommand,
      });
    }

    db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });

    // Which labelled keys no longer resolve to a live, indexed row. Empty is
    // the only acceptable answer — anything else and the numbers below are
    // measuring a broken fixture, not recall.
    const liveIds = new Set(
      db
        .prepare('SELECT id FROM observations WHERE deleted_at IS NULL AND superseded_by IS NULL')
        .all()
        .map((r) => r.id),
    );
    const unresolvedKeys = corpus.entries
      .map((e) => e.key)
      .filter((key) => {
        const id = keyToId.get(key);
        // A deliberately-superseded fixture fact is not "unresolved" — it is
        // still indexed and still findable, it just carries a successor.
        const isSuperseded = corpus.entries.find((e) => e.key === key)?.supersededBy != null;
        return !id || (!liveIds.has(id) && !isSuperseded);
      });
    if (aged) aging.liveAfter = liveIds.size;

    const limit = 10;
    const perQuery = [];
    for (const q of queries.queries) {
      const rankedIds = await pipelineFn({ db, query: q.query, limit, depth, modelId });
      const relevantSet = new Set(q.relevant.map((key) => keyToId.get(key)));
      perQuery.push({
        id: q.id,
        qtype: q.qtype,
        reach: q.reach,
        hops: q.hops,
        edge: q.edge,
        query: q.query,
        metrics: scoreQuery(rankedIds, relevantSet),
        top: rankedIds.slice(0, 5),
      });
    }

    const { overall, byQtype } = aggregate(perQuery);
    const report = {
      ts: new Date().toISOString(),
      variant,
      linkBackend: variant.startsWith('auto') ? linkBackend : null,
      pipeline,
      depth: pipeline === 'graph' ? depth : null,
      aged,
      corpusSize: corpus.entries.length,
      // The DECLARED links (the fixture's). For the auto variants the fixture
      // declares none — what matters there is `appliedEdges`, counted off the
      // rebuilt edges table, i.e. off what actually landed on disk.
      linkedFacts: corpus.entries.filter((e) => (e.related ?? []).length > 0).length,
      appliedEdges: db.prepare("SELECT COUNT(*) AS n FROM edges WHERE type = 'related'").get().n,
      appliedSources: db
        .prepare("SELECT COUNT(DISTINCT src) AS n FROM edges WHERE type = 'related'")
        .get().n,
      ...(backfill
        ? { backfill: { linked: backfill.linked, edges: backfill.edges, floor: backfill.floor, bands: backfill.bands } }
        : {}),
      queryCount: queries.queries.length,
      unresolvedKeys,
      ...(aging ? { aging } : {}),
      overall,
      byQtype,
      perQuery,
    };

    // THE ARM-ALIVE ASSERTION (B2). An `auto-*` variant exists to measure edges
    // the MECHANISM produced; if it produced none, every number below is the
    // control's number wearing another label. Fail loudly instead of publishing
    // it. `unlinked` legitimately has zero; `linked` legitimately has the
    // fixture's own.
    if (variant.startsWith('auto-') && report.appliedEdges === 0) {
      throw new Error(
        `bench:linking — variant '${variant}' produced ZERO related edges, so it is measuring the ` +
          `unlinked control under another name. The linker did not run (check CMK_LINK_FACTS / ` +
          `linkingEnabled) or found nothing above the floor. Refusing to report this as a result.`,
      );
    }

    if (outPath) {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
    }
    if (!quiet) printReport(report, outPath);
    return report;
  } finally {
    try {
      db?.close();
    } catch {
      /* best-effort */
    }
    if (agedSandbox) agedSandbox.cleanup();
    else if (ownSandbox) rmSync(root, { recursive: true, force: true });
  }
}

/**
 * THE CANARY. Prove the instrument can detect a hand-placed win before it is
 * allowed to measure an automatic one.
 *
 * Returns the verdict; the CLI halts on `ok === false` rather than reporting a
 * baseline no one should trust.
 */
export async function runCanary({
  corpusPath = DEFAULT_CORPUS,
  queriesPath = DEFAULT_QUERIES,
  pipeline = 'graph',
  depth = GRAPH_DEFAULT_DEPTH,
  aged = false,
  floor = CANARY_MIN_MARGIN,
  sandboxRoot = null,
  quiet = false,
} = {}) {
  const common = { corpusPath, queriesPath, pipeline, depth, aged, quiet: true };
  const linked = await runLinkBench({
    ...common,
    variant: 'linked',
    sandboxRoot: sandboxRoot ? join(sandboxRoot, 'linked') : null,
  });
  const unlinked = await runLinkBench({
    ...common,
    variant: 'unlinked',
    sandboxRoot: sandboxRoot ? join(sandboxRoot, 'unlinked') : null,
  });

  const at = (report, qtype) => report.byQtype[qtype]?.[CANARY_METRIC] ?? 0;
  const margin = at(linked, CANARY_QTYPE) - at(unlinked, CANARY_QTYPE);

  // The controls guard a FALSE POSITIVE: a margin appearing on a question type
  // linking cannot possibly help would mean the instrument is measuring
  // traversal-in-general rather than links. A control that moves DOWN is a
  // different signal entirely, and a real one — see `controlCost` below.
  const controls = {};
  for (const qtype of LINK_QTYPES) {
    if (qtype === CANARY_QTYPE) continue;
    controls[qtype] = {
      linked: at(linked, qtype),
      unlinked: at(unlinked, qtype),
      delta: at(linked, qtype) - at(unlinked, qtype),
    };
  }

  // THE DILUTION COST — the worst loss any control takes when the corpus gains
  // links. Reported as a headline number rather than buried, because it is a
  // real, measured property of the graph rung and not an artifact: a traversal
  // budget spent on a weak seed's neighbours is a budget not spent on the
  // answer, so ADDING correct links can push an answer the flat pipeline
  // already found out of the top k. It gets worse, not better, as link
  // coverage rises — which is precisely what Task 262 is about to do to the
  // real corpus.
  const controlCost = Math.min(0, ...Object.values(controls).map((c) => c.delta));

  const verdict = {
    ok: margin >= floor,
    floor,
    margin,
    controlCost,
    metric: CANARY_METRIC,
    qtype: CANARY_QTYPE,
    pipeline,
    depth,
    aged,
    linked,
    unlinked,
    controls,
  };
  if (!quiet) printCanary(verdict);
  return verdict;
}

// --- Reporting --------------------------------------------------------------

function fmt(x) {
  return (Math.round(x * 1000) / 1000).toFixed(3);
}

function printReport(report, outPath) {
  const tag = `${report.variant}/${report.pipeline}${report.pipeline === 'graph' ? `@d${report.depth}` : ''}${report.aged ? '/aged' : '/fresh'}`;
  console.log(`\nbench:linking — ${tag}`);
  console.log(
    `corpus: ${report.corpusSize} entries (${report.linkedFacts} declared links · ` +
      `${report.appliedSources} facts carry ${report.appliedEdges} related edges on disk) · queries: ${report.queryCount}\n`,
  );
  console.log('  scope          count   R@5     R@10    NDCG@10');
  const row = (label, agg, count) =>
    console.log(
      `  ${label.padEnd(14)} ${String(count).padStart(5)}   ${fmt(agg['r@5'])}   ${fmt(agg['r@10'])}   ${fmt(agg['ndcg@10'])}`,
    );
  row('OVERALL', report.overall, report.queryCount);
  for (const qtype of LINK_QTYPES) {
    const agg = report.byQtype[qtype];
    if (agg) row(qtype, agg, agg.count);
  }
  if (report.unresolvedKeys.length > 0) {
    console.log(`\n  !! UNRESOLVED corpus keys (the numbers above are invalid): ${report.unresolvedKeys.join(', ')}`);
  }
  if (report.aging) {
    console.log(
      `\n  aged: ${report.aging.driftWritten} drift facts, ${report.aging.tombstoned} tombstoned, ` +
        `${report.aging.superseded} superseded, ${report.aging.unlinked} unlinked → ${report.aging.liveAfter} live rows`,
    );
    if (report.aging.mutatedLabelledKeys.length > 0) {
      console.log(`  !! aging touched labelled facts: ${report.aging.mutatedLabelledKeys.join(', ')}`);
    }
  }
  if (outPath) console.log(`\n  report: ${outPath}`);
}

function printCanary(v) {
  console.log(`\n=== CANARY — can this benchmark detect a KNOWN win? ===`);
  console.log(`  pipeline=${v.pipeline}@d${v.depth} ${v.aged ? 'aged' : 'fresh'} · metric=${v.metric} on ${v.qtype}`);
  console.log(`  hand-linked : ${fmt(v.linked.byQtype[v.qtype][v.metric])}`);
  console.log(`  unlinked twin: ${fmt(v.unlinked.byQtype[v.qtype][v.metric])}`);
  console.log(`  MARGIN       : ${fmt(v.margin)}  (floor ${fmt(v.floor)})  → ${v.ok ? 'PASS' : 'FAIL'}`);
  console.log('\n  controls — a control that GAINS means we are measuring traversal, not linking;');
  console.log('             a control that LOSES is the traversal budget being diluted by links:');
  for (const [qtype, c] of Object.entries(v.controls)) {
    const flag = c.delta > 0 ? '   <-- GAINED (false positive)' : c.delta < 0 ? '   <-- LOST (dilution)' : '';
    console.log(
      `    ${qtype.padEnd(12)} linked ${fmt(c.linked)}  unlinked ${fmt(c.unlinked)}  delta ${fmt(c.delta)}${flag}`,
    );
  }
  console.log(`\n  DILUTION COST: ${fmt(v.controlCost)} (worst control loss — the price of the margin above)`);
}

// --- CLI --------------------------------------------------------------------

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const args = process.argv.slice(2);
  const get = (name, dflt) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split('=').slice(1).join('=') : dflt;
  };
  const has = (name) => args.includes(`--${name}`);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = get('out-dir', join(REPO_ROOT, '.bench-logs'));
  const depth = Number(get('depth', GRAPH_DEFAULT_DEPTH));
  const runAged = get('aged', 'true') !== 'false';

  const canary = await runCanary({ depth });
  if (!canary.ok) {
    console.error(
      '\nHALT — the canary failed: the benchmark could not detect a hand-placed win, so any\n' +
        'linking measurement it produced would be noise. Fix the instrument (the query set, the\n' +
        'traversal, the fusion) before running a baseline. Do NOT lower the floor.\n',
    );
    process.exit(1);
  }
  if (has('canary-only')) {
    writeFileSync(
      join(mkdirSync(outDir, { recursive: true }) ?? outDir, `${stamp}_canary.json`),
      JSON.stringify(canary, null, 2),
      'utf8',
    );
    process.exit(0);
  }

  console.log('\n=== BASELINE (pre-linking) ===');
  // `--semantic` adds the kit's real default recall (FTS5 + sqlite-vec, RRF) and
  // the same traversal seeded from it. Opt-in: it needs the local ONNX embedder,
  // and the default run must be reproducible on a machine without one.
  const pipelines = ['keyword', 'agentic', 'graph'];
  if (has('semantic')) pipelines.push('hybrid', 'graph-hybrid');
  // `--after` adds the two AUTOMATIC variants beside the BEFORE and the
  // ceiling, so one run prints the whole before/after/ceiling comparison
  // ADR-0023's trigger asks for.
  // The linker's own backend follows --semantic: with the embedder present the
  // shipped `cmk autolink --semantic` path is what gets measured.
  const linkBackend = has('semantic') ? 'semantic' : 'jaccard';
  const variants = has('after')
    ? ['unlinked', 'auto-write', 'auto-backfill', 'linked']
    : ['unlinked', 'linked'];
  const matrix = [];
  for (const aged of runAged ? [false, true] : [false]) {
    for (const variant of variants) {
      for (const pipeline of pipelines) {
        const outPath = join(outDir, `${stamp}_${variant}-${pipeline}-${aged ? 'aged' : 'fresh'}.json`);
        matrix.push(await runLinkBench({ variant, pipeline, depth, aged, outPath, linkBackend }));
      }
    }
  }

  console.log('\n=== SUMMARY (R@5 per qtype) ===');
  console.log('  variant        pipeline  age     overall  single-hop  multi-hop  temporal  preference');
  for (const r of matrix) {
    const c = (q) => fmt(r.byQtype[q]?.['r@5'] ?? 0);
    console.log(
      `  ${r.variant.padEnd(14)} ${r.pipeline.padEnd(9)} ${(r.aged ? 'aged' : 'fresh').padEnd(7)} ` +
        `${fmt(r.overall['r@5'])}    ${c('single-hop').padEnd(11)} ${c('multi-hop').padEnd(10)} ` +
        `${c('temporal').padEnd(9)} ${c('preference')}`,
    );
  }
  const summaryPath = join(outDir, `${stamp}_summary.json`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(summaryPath, JSON.stringify({ canary, matrix }, null, 2), 'utf8');
  console.log(`\nsummary: ${summaryPath}`);
}
