#!/usr/bin/env node
// Task 99 — recall benchmark: gives the Layer-5b bake-off (Task 65) a number
// to beat (D-70/D-72, MemPalace's LongMemEval harness shape at kit scale).
//
//   npm run bench:recall                          → keyword baseline
//   npm run bench:recall -- --pipeline=agentic    → rung 0b (iterative keyword)
//   npm run bench:recall -- --pipeline=agentic --reformulator=haiku
//                                                 → rung 0b with live-Haiku
//                                                   query reformulation
//
// Metrics: R@5 / R@10 / NDCG@10, overall + per-question-type (paraphrase /
// exact / temporal / preference — the per-type split tells you WHICH recall
// fix to build next, per D-72). Raw-vs-reranked are reported as separate
// pipeline runs (the MemPalace honesty norm).
//
// The corpus seeds through the kit's REAL write paths (writeFact /
// appendScratchpadBullet) into a temp sandbox (never the host's tiers — the
// Task-98 isolation lesson), indexes via the REAL reindexFull, and queries
// via the REAL search() — so the number measures what `cmk search` actually
// does, not an idealized pipeline.
//
// Pipelines:
//   keyword  — one-shot FTS5 (today's `cmk search` behavior; baseline floor)
//   agentic  — rung 0b: the full query + stopword-stripped sub-queries
//              (+ optional LLM reformulations), fused with RRF k=60. The
//              deterministic emulation of agent-as-retriever iteration —
//              per Anthropic's "start with agentic search and only add
//              semantic search if you need it", the Task-65 embedder must
//              beat THIS rung, not just one-shot keyword (D-105).
//   (semantic / hybrid / reranked rungs plug in here during Task 65 —
//    each is one entry in PIPELINES.)

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { appendScratchpadBullet } from '../packages/cli/src/scratchpad.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
import { search, SEARCH_MODES, reciprocalRankFusion } from '../packages/cli/src/search.mjs';
import { prepareSemanticBackend, rerankResults } from '../packages/cli/src/semantic-backend.mjs';
import {
  parse as parseFrontmatter,
  format as formatFrontmatter,
} from '../packages/cli/src/frontmatter.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');

// --- Metrics (pure; unit-tested in tests/bench-recall.test.js) ------------

export function recallAtK(rankedIds, relevantSet, k) {
  if (relevantSet.size === 0) return 0;
  const top = rankedIds.slice(0, k);
  let found = 0;
  for (const id of relevantSet) if (top.includes(id)) found += 1;
  return found / relevantSet.size;
}

export function ndcgAtK(rankedIds, relevantSet, k) {
  if (relevantSet.size === 0) return 0;
  const top = rankedIds.slice(0, k);
  let dcg = 0;
  top.forEach((id, i) => {
    if (relevantSet.has(id)) dcg += 1 / Math.log2(i + 2);
  });
  let idcg = 0;
  const ideal = Math.min(relevantSet.size, k);
  for (let i = 0; i < ideal; i++) idcg += 1 / Math.log2(i + 2);
  return idcg === 0 ? 0 : dcg / idcg;
}

const METRIC_KEYS = ['r@5', 'r@10', 'ndcg@10'];

function scoreQuery(rankedIds, relevantSet) {
  return {
    'r@5': recallAtK(rankedIds, relevantSet, 5),
    'r@10': recallAtK(rankedIds, relevantSet, 10),
    'ndcg@10': ndcgAtK(rankedIds, relevantSet, 10),
  };
}

export function aggregate(perQuery) {
  const mean = (rows, key) =>
    rows.length === 0 ? 0 : rows.reduce((s, r) => s + r.metrics[key], 0) / rows.length;
  const overall = {};
  for (const key of METRIC_KEYS) overall[key] = mean(perQuery, key);
  const byQtype = {};
  for (const row of perQuery) {
    (byQtype[row.qtype] ??= []).push(row);
  }
  for (const [qtype, rows] of Object.entries(byQtype)) {
    const agg = { count: rows.length };
    for (const key of METRIC_KEYS) agg[key] = mean(rows, key);
    byQtype[qtype] = agg;
  }
  return { overall, byQtype };
}

// --- Rung 0b: agentic-keyword reformulation -------------------------------

// Minimal English stopword set — enough to strip query scaffolding ("which
// ... do we use") down to content tokens. Deliberately small; rung 0b is an
// EMULATION of iterative keyword search, not a linguistics project.
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'be', 'before', 'big', 'do', 'does', 'for',
  'happened', 'how', 'in', 'is', 'it', 'of', 'on', 'or', 'our', 'should',
  'the', 'this', 'to', 'use', 'we', 'what', 'when', 'where', 'which', 'who',
  'with',
]);

export function buildSubQueries(query) {
  const out = [query];
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  for (const t of tokens) if (!out.includes(t)) out.push(t);
  return out;
}

// RRF k=60 across sub-query result lists (same constant the D-72 recipe
// fixes for the Task-65 hybrid — one fusion convention across the kit).
export function fuseRankings(lists, k = 60) {
  const scores = new Map();
  const firstSeen = new Map();
  let seen = 0;
  for (const list of lists) {
    list.forEach((id, i) => {
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
      if (!firstSeen.has(id)) firstSeen.set(id, seen++);
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || firstSeen.get(a[0]) - firstSeen.get(b[0]))
    .map(([id]) => id);
}

// Optional live-Haiku reformulator (the honest version of rung 0b — the
// agent IS an LLM). Used by `--reformulator=haiku`; benchmark runs that use
// it record results separately from the deterministic runs.
async function haikuReformulate(query) {
  const { HaikuViaAnthropicApi } = await import('../packages/cli/src/compressor.mjs');
  const backend = new HaikuViaAnthropicApi();
  const r = await backend.compress({
    input: query,
    instructions:
      'You reformulate a natural-language question into search keywords. ' +
      'Output up to 4 alternative SHORT keyword queries (1-3 words each, synonyms and related technical terms), one per line. ' +
      'No numbering, no commentary — just the queries.',
    maxOutputBytes: 400,
    timeoutMs: 30_000,
  });
  return r.outputText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.length < 80)
    .slice(0, 4);
}

// --- Seeding (real write paths, sandboxed) ---------------------------------

const SCRATCHPAD_SKELETONS = {
  'MEMORY.md': '# Working Memory\n\n## Active Threads\n\n## Environment Notes\n\n## Pending Decisions\n',
  'HABITS.md': '# Habits\n\n## Iteration Cadence\n\n## Tooling Habits\n\n## Review Style\n',
};

function sha1(text) {
  return createHash('sha1').update(text, 'utf8').digest('hex');
}

/**
 * Seed a benchmark corpus through the kit's REAL write paths into a sandbox.
 *
 * Exported (Task 262) so the linking benchmark seeds identically rather than
 * re-rolling the same writeFact/appendScratchpadBullet walk — the shared-module
 * discipline applied to the bench harness. Two OPTIONAL entry fields are
 * honored, both no-ops for a corpus that omits them (the Task-99 recall fixture
 * does, so its numbers are unchanged):
 *
 *   related: [slug, ...]   passed through to writeFact's `related` option, which
 *                          becomes `related:` frontmatter and therefore `related`
 *                          rows in the edges table at reindex.
 *   supersededBy: key      patched into the written fact's frontmatter in a
 *                          SECOND pass, because the successor's id is not known
 *                          until every fact has been written. writeFact has no
 *                          `superseded_by` option (a fact is normally superseded
 *                          by merge-facts, which MOVES it), so the on-disk form
 *                          is the honest stand-in — the same shape the aged
 *                          harness writes.
 */
export function seedCorpus({
  corpus,
  projectRoot,
  userDir,
  sourceFile = 'fixtures/recall-bench/corpus.json',
  // Task 262: write-time linking defaults ON in production, which would make
  // every benchmark variant — INCLUDING the unlinked twin the canary compares
  // against — grow edges the fixture never declared. A benchmark whose control
  // is contaminated by the thing under test measures nothing, so seeding is
  // explicitly UNLINKED unless a variant asks for the linker (`autoLink: true`),
  // which preserves the Task-99 fixture's numbers byte-for-byte.
  autoLink = false,
  // Called after each fact write. The write-time linking variant uses it to
  // refresh the SQLite index between writes, because a fact can only ever link
  // to what was already indexed when it was written — the real, one-directional
  // constraint of the write path.
  onFactWritten = null,
}) {
  mkdirSync(join(projectRoot, 'context', 'memory'), { recursive: true });
  mkdirSync(userDir, { recursive: true });
  const keyToId = new Map();
  const keyToPath = new Map();
  corpus.entries.forEach((entry, i) => {
    if (entry.kind === 'fact') {
      const r = writeFact({
        tier: entry.tier,
        type: entry.type,
        slug: entry.key,
        title: entry.title,
        body: entry.body,
        writeSource: 'user-explicit',
        trust: entry.trust,
        sourceFile,
        sourceLine: i + 1,
        sourceSha1: sha1(entry.body),
        createdAt: entry.createdAt,
        ...(entry.related?.length ? { related: entry.related } : {}),
        autoLink,
        projectRoot,
        userDir,
      });
      if (r.action === 'error') {
        throw new Error(`seed fact ${entry.key} failed: ${r.errors?.join('; ')}`);
      }
      keyToId.set(entry.key, r.id);
      keyToPath.set(entry.key, r.path);
      onFactWritten?.(r, entry);
    } else {
      const tierRoot = entry.tier === 'U' ? userDir : join(projectRoot, 'context');
      const padPath = join(tierRoot, entry.scratchpad);
      if (!existsSync(padPath)) {
        const skeleton = SCRATCHPAD_SKELETONS[entry.scratchpad];
        if (!skeleton) throw new Error(`no skeleton for ${entry.scratchpad}`);
        writeFileSync(padPath, skeleton, 'utf8');
      }
      const r = appendScratchpadBullet({
        tier: entry.tier,
        scratchpad: entry.scratchpad,
        section: entry.section,
        text: entry.text,
        provenance: {
          source: sourceFile,
          source_line: i + 1,
          sha1: sha1(entry.text),
          write: 'user-explicit',
          trust: entry.trust,
          at: entry.createdAt,
        },
        projectRoot,
        userDir,
      });
      if (r.action === 'error') {
        throw new Error(`seed bullet ${entry.key} failed: ${r.errors?.join('; ')}`);
      }
      keyToId.set(entry.key, r.id);
    }
  });

  // Second pass: supersession. The successor's id only exists after every fact
  // is written, so the backward pointer is patched in afterwards. Frontmatter
  // goes through the shared parser/formatter, never a hand-rolled string splice.
  for (const entry of corpus.entries) {
    if (!entry.supersededBy) continue;
    const path = keyToPath.get(entry.key);
    const successorId = keyToId.get(entry.supersededBy);
    if (!path || !successorId) {
      throw new Error(`seed supersession ${entry.key} -> ${entry.supersededBy}: unresolved`);
    }
    const parsed = parseFrontmatter(readFileSync(path, 'utf8'));
    parsed.frontmatter.superseded_by = successorId;
    writeFileSync(path, formatFrontmatter(parsed), 'utf8');
  }

  return keyToId;
}

// --- Pipelines --------------------------------------------------------------

function searchIds({ db, query, limit }) {
  const r = search({ db, query, mode: SEARCH_MODES.KEYWORD, limit });
  // FTS5 parse errors / no hits both count as "this query found nothing" —
  // the benchmark measures the tool as users hit it, not an idealized parser.
  if (r.action === 'error') return [];
  return r.results.map((hit) => hit.id);
}

// Each pipeline: async ({db, query, limit, reformulate}) → ranked id list.
// (Async so the LLM reformulator slots in; deterministic paths resolve
// immediately.)
const PIPELINES = {
  keyword: async ({ db, query, limit }) => searchIds({ db, query, limit }),
  agentic: async ({ db, query, limit, reformulate }) => {
    const subs = buildSubQueries(query);
    if (reformulate) {
      for (const extra of await reformulate(query)) {
        if (!subs.includes(extra)) subs.push(extra);
      }
    }
    // NB: each sub-query fetches only `limit` candidates (no D-72-style 3×
    // over-fetch). That slightly UNDERSTATES rung 0b — fine for a baseline
    // floor; the Task-65 hybrid is where over-fetch-then-rerank lands.
    const lists = subs.map((sq) => searchIds({ db, query: sq, limit }));
    return fuseRankings(lists).slice(0, limit);
  },
  // --- Task 65 rungs (the embedded backend behind the search() seam) ------
  semantic: async ({ db, query, limit, modelId }) => {
    const prep = await prepareSemanticBackend({ db, query, ...(modelId ? { modelId } : {}) });
    if (!prep.ok) throw new Error(`semantic backend unavailable: ${prep.reason}`);
    const r = search({ db, query, mode: SEARCH_MODES.SEMANTIC, semanticBackend: prep.backend, limit });
    if (r.action === 'error') return [];
    return r.results.map((h) => h.id);
  },
  hybrid: async ({ db, query, limit, modelId }) => {
    const prep = await prepareSemanticBackend({ db, query, ...(modelId ? { modelId } : {}) });
    if (!prep.ok) throw new Error(`semantic backend unavailable: ${prep.reason}`);
    const r = search({ db, query, mode: SEARCH_MODES.HYBRID, semanticBackend: prep.backend, limit });
    if (r.action === 'error') return [];
    return r.results.map((h) => h.id);
  },
  // hybrid + the D-72 deterministic rerank (keyword 0.30 / temporal 0.40) —
  // reported separately per the MemPalace raw-vs-reranked honesty norm.
  'hybrid-rerank': async ({ db, query, limit, modelId }) => {
    const prep = await prepareSemanticBackend({ db, query, ...(modelId ? { modelId } : {}) });
    if (!prep.ok) throw new Error(`semantic backend unavailable: ${prep.reason}`);
    // Over-fetch for the rerank stage, then cut to limit after.
    const keyword = searchResults({ db, query, limit: limit * 3 });
    const semantic = prep.backend({ limit: limit * 3 });
    const fused = reciprocalRankFusion({ keywordResults: keyword, semanticResults: semantic });
    return rerankResults(fused, { query }).slice(0, limit).map((h) => h.id);
  },
};

function searchResults({ db, query, limit }) {
  const r = search({ db, query, mode: SEARCH_MODES.KEYWORD, limit });
  if (r.action === 'error') return [];
  return r.results;
}

// --- Runner -----------------------------------------------------------------

export async function runBench({
  corpusPath = join(REPO_ROOT, 'fixtures', 'recall-bench', 'corpus.json'),
  queriesPath = join(REPO_ROOT, 'fixtures', 'recall-bench', 'queries.json'),
  pipeline = 'keyword',
  reformulate = null,
  modelId = null,
  sandboxRoot = null,
  outPath = null,
  quiet = false,
} = {}) {
  const pipelineFn = PIPELINES[pipeline];
  if (!pipelineFn) {
    throw new Error(
      `unknown pipeline '${pipeline}' — available: ${Object.keys(PIPELINES).join(', ')}`,
    );
  }
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8'));
  const queries = JSON.parse(readFileSync(queriesPath, 'utf8'));

  const ownSandbox = sandboxRoot == null;
  const root = sandboxRoot ?? mkdtempSync(join(tmpdir(), 'cmk-bench-'));
  const projectRoot = join(root, 'bench-proj');
  const userDir = join(root, 'bench-user');

  let db;
  try {
    const keyToId = seedCorpus({ corpus, projectRoot, userDir });
    db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });

    const limit = 10;
    const perQuery = [];
    for (const q of queries.queries) {
      const rankedIds = await pipelineFn({ db, query: q.query, limit, reformulate, modelId });
      const relevantSet = new Set(q.relevant.map((key) => keyToId.get(key)));
      perQuery.push({
        id: q.id,
        qtype: q.qtype,
        query: q.query,
        metrics: scoreQuery(rankedIds, relevantSet),
        top: rankedIds.slice(0, 5),
      });
    }

    const { overall, byQtype } = aggregate(perQuery);
    const report = {
      ts: new Date().toISOString(),
      pipeline,
      model: modelId ?? 'default',
      reformulator: reformulate ? (reformulate === haikuReformulate ? 'haiku' : 'injected') : 'none',
      corpusSize: corpus.entries.length,
      queryCount: queries.queries.length,
      overall,
      byQtype,
      perQuery,
    };

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
    if (ownSandbox) rmSync(root, { recursive: true, force: true });
  }
}

function fmt(x) {
  return (Math.round(x * 1000) / 1000).toFixed(3);
}

function printReport(report, outPath) {
  console.log(`\nbench:recall — pipeline=${report.pipeline} reformulator=${report.reformulator}`);
  console.log(`corpus: ${report.corpusSize} entries · queries: ${report.queryCount}\n`);
  console.log('  scope          count   R@5     R@10    NDCG@10');
  const row = (label, agg, count) =>
    console.log(
      `  ${label.padEnd(14)} ${String(count).padStart(5)}   ${fmt(agg['r@5'])}   ${fmt(agg['r@10'])}   ${fmt(agg['ndcg@10'])}`,
    );
  row('OVERALL', report.overall, report.queryCount);
  for (const [qtype, agg] of Object.entries(report.byQtype)) {
    row(qtype, agg, agg.count);
  }
  const misses = report.perQuery.filter((p) => p.metrics['r@10'] === 0);
  if (misses.length > 0) {
    console.log(`\n  missed entirely (r@10 = 0): ${misses.map((m) => m.id).join(', ')}`);
  }
  if (outPath) console.log(`\n  report: ${outPath}`);
}

// --- CLI entry ---------------------------------------------------------------

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const args = process.argv.slice(2);
  const get = (name, dflt) => {
    const hit = args.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.split('=').slice(1).join('=') : dflt;
  };
  const pipeline = get('pipeline', 'keyword');
  const reformulator = get('reformulator', 'none');
  const model = get('model', null);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = get(
    'out',
    join(REPO_ROOT, '.bench-logs', `${stamp}_${pipeline}${reformulator === 'haiku' ? '-haiku' : ''}.json`),
  );
  await runBench({
    pipeline,
    modelId: model,
    reformulate: reformulator === 'haiku' ? haikuReformulate : null,
    outPath,
  });
}
