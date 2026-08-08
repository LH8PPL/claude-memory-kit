// @doors: 1, 2, 3, 5
// Door 1: the exported contracts — stripLinks' return, runLinkBench's report
//   shape, runCanary's verdict object, and the unknown-pipeline error path.
// Door 2: on-disk state — the JSON report lands and round-trips; the AGED run's
//   labelled corpus is still fully live after the mutate/rebuild phase (a
//   measurement taken over a corpus the aging ate would be meaningless, so the
//   survival assertion is part of the contract, not a nicety).
// Door 3: the aged path drives the REAL `cmk` bin as subprocesses (remember /
//   forget / reindex --boot / reindex --full) via the Task-261 aged-corpus
//   sandbox. `onCommand` records every argv, and the test pins the exact
//   command sequence — the aging is the half that must not be simulated.
// Door 4 N/A: no message-queue surface.
// Door 5: the benchmark's observability artifact is its JSON report (the
//   .bench-logs/ run record) — asserted written + round-tripping, same
//   convention as tests/bench-recall.test.js.

// Task 262 sub-task 1 — the relational-recall benchmark (scripts/bench-linking.mjs).
//
// What this file guards, in one line: that the benchmark can DETECT A KNOWN WIN.
// Everything else here is scaffolding around that. The KiroCrew auto_improvement
// discipline (D-429) says a measurement system must prove its own sensitivity
// before it is allowed to measure anything — so the canary test below is the
// load-bearing one, and a failure of it means the benchmark cannot measure,
// not that linking does not help.
//
// Boundary discipline: the public exports only. The seeding + aging internals
// are exercised THROUGH runLinkBench, never poked at directly.

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CANARY_MIN_MARGIN,
  LINK_QTYPES,
  stripLinks,
  runLinkBench,
  runCanary,
} from '../scripts/bench-linking.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');
const CORPUS_PATH = join(REPO_ROOT, 'fixtures', 'link-bench', 'corpus.json');
const QUERIES_PATH = join(REPO_ROOT, 'fixtures', 'link-bench', 'queries.json');

const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8'));
const queries = JSON.parse(readFileSync(QUERIES_PATH, 'utf8'));

const sandboxes = [];
function sandbox(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  sandboxes.push(dir);
  return dir;
}
afterAll(() => {
  for (const dir of sandboxes) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    } catch {
      /* the OS reclaims tmpdir; never fail a run on cleanup */
    }
  }
});

describe('Task 262 — fixture integrity (the corpus IS the experiment)', () => {
  it('corpus keys are unique, every `related` slug resolves, and no fact links to itself', () => {
    const keys = corpus.entries.map((e) => e.key);
    expect(new Set(keys).size).toBe(keys.length);
    const keySet = new Set(keys);
    for (const e of corpus.entries) {
      for (const slug of e.related ?? []) {
        expect(keySet.has(slug), `${e.key} links to unknown slug ${slug}`).toBe(true);
        expect(slug).not.toBe(e.key);
      }
      if (e.supersededBy) expect(keySet.has(e.supersededBy)).toBe(true);
      // Cap 3 out-links — the research verdict (2026-08-04 link-cap note §3).
      // The fixture must not model a shape the writer will never produce.
      expect((e.related ?? []).length).toBeLessThanOrEqual(3);
    }
  });

  it('every query names a real corpus key, a known qtype, and states its reachability honestly', () => {
    const keySet = new Set(corpus.entries.map((e) => e.key));
    const ids = queries.queries.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const q of queries.queries) {
      expect(LINK_QTYPES).toContain(q.qtype);
      expect(['flat', 'partial', 'link-only']).toContain(q.reach);
      expect(q.relevant.length).toBeGreaterThan(0);
      for (const key of q.relevant) {
        expect(keySet.has(key), `query ${q.id} references unknown key ${key}`).toBe(true);
      }
    }
  });

  it('multi-hop answers are reachable by a `related` walk; temporal ones by `superseded_by` ONLY', () => {
    const byKey = new Map(corpus.entries.map((e) => [e.key, e]));
    const reachable = (startKeys, edgeOf, depth) => {
      const seen = new Set(startKeys);
      let frontier = [...startKeys];
      for (let d = 0; d < depth; d++) {
        const next = [];
        for (const k of frontier) {
          for (const n of edgeOf(byKey.get(k))) {
            if (!seen.has(n)) {
              seen.add(n);
              next.push(n);
            }
          }
        }
        frontier = next;
      }
      return seen;
    };
    const related = (e) => e?.related ?? [];
    const superseded = (e) => (e?.supersededBy ? [e.supersededBy] : []);

    for (const q of queries.queries) {
      if (q.qtype === 'multi-hop') {
        // Some fact in the corpus must reach every relevant answer within
        // q.hops `related` steps — otherwise the question is unanswerable even
        // with a perfect traversal, which would make a low score meaningless.
        const anyReaches = corpus.entries.some((seed) => {
          const set = reachable([seed.key], related, q.hops);
          return q.relevant.every((r) => set.has(r));
        });
        expect(anyReaches, `${q.id}: no ${q.hops}-hop related path reaches its answer`).toBe(true);
      }
      if (q.qtype === 'temporal') {
        const anyReaches = corpus.entries.some((seed) => {
          const set = reachable([seed.key], superseded, q.hops);
          return q.relevant.every((r) => set.has(r));
        });
        expect(anyReaches, `${q.id}: no supersession chain reaches its answer`).toBe(true);
        // The control's whole job: it must NOT depend on a `related` edge.
        for (const r of q.relevant) {
          const viaRelated = corpus.entries.some((e) => (e.related ?? []).includes(r));
          expect(viaRelated, `${q.id}: temporal control answer ${r} is also a related target`).toBe(false);
        }
      }
    }
  });
});

describe('Task 262 — stripLinks: the unlinked twin (Door 1 + over-mutation guard)', () => {
  it('removes every `related` list and NOTHING else, without mutating the input', () => {
    const before = JSON.parse(JSON.stringify(corpus));
    const stripped = stripLinks(corpus);

    // The input is untouched (the runner strips per-variant from one parsed
    // corpus; a mutating strip would silently poison the linked run that
    // follows it in the same process).
    expect(corpus).toEqual(before);

    // Same entries, same order, same everything but `related`.
    expect(stripped.entries.length).toBe(corpus.entries.length);
    const linkedCount = corpus.entries.filter((e) => (e.related ?? []).length > 0).length;
    expect(linkedCount).toBeGreaterThan(0);
    stripped.entries.forEach((e, i) => {
      const orig = corpus.entries[i];
      expect(e.related).toBeUndefined();
      const { related: _drop, ...rest } = orig;
      expect(e).toEqual(rest);
    });

    // supersededBy SURVIVES the strip — that is what makes the temporal qtype
    // a control rather than a second copy of the multi-hop measurement.
    const supersededBefore = corpus.entries.filter((e) => e.supersededBy).length;
    expect(supersededBefore).toBeGreaterThan(0);
    expect(stripped.entries.filter((e) => e.supersededBy).length).toBe(supersededBefore);
  });
});

describe('Task 262 — runLinkBench (Doors 1 + 2 + 5)', () => {
  it('rejects an unknown pipeline and names the available ones', async () => {
    await expect(runLinkBench({ pipeline: 'nope', quiet: true })).rejects.toThrow(
      /unknown pipeline 'nope'.*graph/,
    );
  });

  it('graph pipeline on the LINKED corpus: documented report shape, JSON artifact on disk', async () => {
    const root = sandbox('cmk-linkbench-');
    const outPath = join(root, 'report.json');
    const report = await runLinkBench({
      corpusPath: CORPUS_PATH,
      queriesPath: QUERIES_PATH,
      variant: 'linked',
      pipeline: 'graph',
      sandboxRoot: root,
      outPath,
      quiet: true,
    });

    // Door 1 — report shape.
    expect(report.variant).toBe('linked');
    expect(report.pipeline).toBe('graph');
    expect(report.aged).toBe(false);
    expect(report.overall).toHaveProperty('r@5');
    expect(report.overall).toHaveProperty('ndcg@10');
    expect(report.byQtype['multi-hop'].count).toBeGreaterThan(5);
    expect(report.perQuery.length).toBe(queries.queries.length);
    expect(report.corpusSize).toBe(corpus.entries.length);
    // Every labelled key resolved to a real id at seed time — a query whose
    // relevant set is `undefined` scores 0 and looks like a recall failure.
    expect(report.unresolvedKeys).toEqual([]);

    // Door 5 / Door 2 — the artifact.
    expect(existsSync(outPath)).toBe(true);
    const onDisk = JSON.parse(readFileSync(outPath, 'utf8'));
    expect(onDisk.overall['r@5']).toBe(report.overall['r@5']);
    expect(onDisk.byQtype['multi-hop']['r@5']).toBe(report.byQtype['multi-hop']['r@5']);
  }, 300_000);

  it('is deterministic: the same variant + pipeline scores identically on a second run', async () => {
    const a = await runLinkBench({
      corpusPath: CORPUS_PATH, queriesPath: QUERIES_PATH,
      variant: 'unlinked', pipeline: 'keyword',
      sandboxRoot: sandbox('cmk-linkbench-det1-'), quiet: true,
    });
    const b = await runLinkBench({
      corpusPath: CORPUS_PATH, queriesPath: QUERIES_PATH,
      variant: 'unlinked', pipeline: 'keyword',
      sandboxRoot: sandbox('cmk-linkbench-det2-'), quiet: true,
    });
    expect(b.overall).toEqual(a.overall);
    expect(b.perQuery.map((p) => p.metrics)).toEqual(a.perQuery.map((p) => p.metrics));
  }, 300_000);
});

describe('Task 262 — THE CANARY: the benchmark must detect a known win (D-429)', () => {
  it('a hand-linked corpus beats its identical unlinked twin on multi-hop, by more than the floor', async () => {
    const verdict = await runCanary({
      corpusPath: CORPUS_PATH,
      queriesPath: QUERIES_PATH,
      sandboxRoot: sandbox('cmk-linkbench-canary-'),
      quiet: true,
    });

    // Door 1 — the verdict object.
    expect(verdict.floor).toBe(CANARY_MIN_MARGIN);
    expect(verdict.metric).toBe('r@5');
    expect(verdict.qtype).toBe('multi-hop');

    // THE assertion. If this fails, the benchmark cannot measure linking and
    // the run must halt rather than optimize noise.
    expect(verdict.margin).toBeGreaterThanOrEqual(CANARY_MIN_MARGIN);
    expect(verdict.ok).toBe(true);

    // The twins differ ONLY in links: same corpus size, same query count.
    expect(verdict.linked.corpusSize).toBe(verdict.unlinked.corpusSize);
    expect(verdict.linked.queryCount).toBe(verdict.unlinked.queryCount);

    // THE CONTROLS, in the direction they actually guard.
    //
    // A control that GAINS is the false positive: linking cannot help a
    // question answerable without a `related:` edge, so a gain would mean the
    // margin above is measuring traversal-in-general. No control may gain.
    for (const qtype of ['single-hop', 'temporal', 'preference']) {
      expect(verdict.controls[qtype].delta, `${qtype} gained — the margin is not attributable to links`)
        .toBeLessThanOrEqual(0);
    }
    // The two flat-answerable controls are bit-stable across the twins.
    expect(verdict.controls['single-hop'].delta).toBe(0);
    expect(verdict.controls.preference.delta).toBe(0);

    // The temporal control LOSES, and that is a measured property rather than a
    // failure: a traversal budget spent on a weak seed's `related:` neighbours
    // is a budget not spent on the supersession answer, so adding correct links
    // can evict an answer the unlinked twin found. It is pinned here, not
    // waved through — a change that makes the dilution worse must fail.
    expect(verdict.controlCost).toBeLessThan(0);
    expect(
      verdict.controlCost,
      'link traversal is diluting flat recall further than the measured baseline',
    ).toBeGreaterThanOrEqual(-0.25);
  }, 600_000);

  it('single-hop recall does not REGRESS under link traversal (the precision guard)', async () => {
    const root = sandbox('cmk-linkbench-noregress-');
    const flat = await runLinkBench({
      corpusPath: CORPUS_PATH, queriesPath: QUERIES_PATH,
      variant: 'linked', pipeline: 'keyword',
      sandboxRoot: join(root, 'a'), quiet: true,
    });
    const graph = await runLinkBench({
      corpusPath: CORPUS_PATH, queriesPath: QUERIES_PATH,
      variant: 'linked', pipeline: 'graph',
      sandboxRoot: join(root, 'b'), quiet: true,
    });
    for (const qtype of ['single-hop', 'preference']) {
      expect(
        graph.byQtype[qtype]['r@5'],
        `${qtype}: graph traversal pushed a flat-answerable fact out of the top 5`,
      ).toBeGreaterThanOrEqual(flat.byQtype[qtype]['r@5']);
    }
  }, 600_000);
});

describe('Task 262 — the AGED run drives the real bins (Doors 2 + 3)', () => {
  it('build -> mutate -> rebuild -> measure: the labelled corpus survives, and the mutations are real subprocesses', async () => {
    const commands = [];
    const report = await runLinkBench({
      corpusPath: CORPUS_PATH,
      queriesPath: QUERIES_PATH,
      variant: 'linked',
      pipeline: 'graph',
      aged: true,
      quiet: true,
      onCommand: (argv) => commands.push(argv),
    });

    expect(report.aged).toBe(true);

    // Door 3 — the aging ran through the REAL cmk bin, in the documented order.
    const verbs = commands.map((argv) => argv[0]);
    expect(verbs).toContain('install');
    expect(verbs).toContain('remember');
    expect(verbs).toContain('forget');
    expect(verbs.filter((v) => v === 'reindex').length).toBeGreaterThanOrEqual(2);
    const reindexArgs = commands.filter((a) => a[0] === 'reindex').map((a) => a[1]);
    expect(reindexArgs).toContain('--boot');
    expect(reindexArgs).toContain('--full');
    // The mutations must never touch a LABELLED fact — only drift/filler ones.
    expect(report.aging.mutatedLabelledKeys).toEqual([]);

    // Door 2 — every labelled key is still a live, indexed row after the
    // rebuild, so the numbers below it mean something.
    expect(report.unresolvedKeys).toEqual([]);
    // Each mutation class actually fired. (Not `liveAfter > corpusSize`: the
    // live set excludes the 5 deliberately-superseded fixture facts, so that
    // comparison is between two different populations and says nothing.)
    expect(report.aging.driftWritten).toBeGreaterThanOrEqual(8);
    expect(report.aging.tombstoned).toBeGreaterThan(0);
    expect(report.aging.superseded).toBeGreaterThan(0);
    expect(report.aging.unlinked).toBeGreaterThan(0);
    expect(report.aging.liveAfter).toBeGreaterThan(0);
  }, 900_000);
});
