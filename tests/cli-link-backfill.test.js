// @doors: 1, 2, 5
// Door 1: the run report — evaluated / linked / edges / remaining / bands, and
//   the dry-run's identical shape with zero writes.
// Door 2: the STATE — `related:` appended to exactly the facts that earned it,
//   the `link_eval` resume markers inside the rebuildable INDEX (never a
//   sidecar file in the tier), the `related` EDGE ROWS the in-band index sync
//   lands (no manual `cmk reindex --boot`), and the over-mutation guard.
// Door 3 N/A: the backfill is in-process; the CLI verb's real-bin exercise is
//   the live-test recorded in the task report.
// Door 4 N/A: no message queue.
// Door 5: one `auto-linked` audit entry per backfilled fact, carrying
//   mode: 'backfill' so a backfilled edge is distinguishable from a write-time
//   one forever.
//
// Task 262 sub-task 3 — THE BACKFILL.
//
// Write-time linking only ever helps facts written FROM NOW ON. The 2,220
// facts already on disk (96% of them unlinked) need a pass of their own, and
// ADR-0020 governs its shape: the smallest durable unit is ONE fact, each unit
// persists as it goes, and the resume point is DERIVED FROM THE ARTIFACTS —
// never a two-writer watermark sidecar.
//
// The two artifacts that answer "has this fact been considered?":
//   1. the fact's own markdown carries `related:`  → it was linked;
//   2. a `link_eval` row in the INDEX matches its content sha → it was
//      considered and had no candidates above the floor.
// (2) lives in the rebuildable index precisely because losing it is harmless:
// a full reindex drops it and the next backfill simply re-considers those
// facts, which is idempotent work, not lost work.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, chmodSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  linkBackfill,
  linkBackfillToCompletion,
  syncIndexAfterBackfill,
  countLinkBackfillPending,
} from '../packages/cli/src/link-backfill.mjs';
import { writeLinkFloor, FLOOR_QUANTILE } from '../packages/cli/src/link-facts.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
import { eachLiveFact } from '../packages/cli/src/fact-store.mjs';
import { hashContent } from '../packages/cli/src/content-hash.mjs';
import { install } from '../packages/cli/src/install.mjs';

let sandbox;
let projectRoot;
let userDir;

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-linkbf-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
  delete process.env.CMK_LINK_FACTS;
});

afterEach(() => {
  delete process.env.CMK_LINK_FACTS;
  // Several cases below assert a NON-ZERO exit for an anomaly. `process.exitCode`
  // is process-wide and outlives the test that set it, so it is reset here or a
  // green file can still exit non-zero.
  process.exitCode = 0;
  rmSync(sandbox, { recursive: true, force: true });
});

const factDir = () => join(projectRoot, 'context', 'memory');
const FACT_FILE_RE = /^(user|feedback|project|reference|judgment)_.+\.md$/;

function snapshotFactFiles() {
  const out = new Map();
  for (const name of readdirSync(factDir())) {
    if (!FACT_FILE_RE.test(name)) continue;
    out.set(name, readFileSync(join(factDir(), name), 'utf8'));
  }
  return out;
}

function auditLines() {
  const p = join(projectRoot, 'context', '.locks', 'audit.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8').split(/\r?\n/).filter(Boolean).map((l) => JSON.parse(l));
}

/**
 * A corpus of `clusters` topical clusters of 4 facts each, plus filler. Facts
 * inside a cluster share most of their vocabulary; facts across clusters share
 * none — so a floor of 0.15 links within a cluster and never across.
 */
function seedClusteredCorpus({ clusters = 4, filler = 20 } = {}) {
  for (let c = 0; c < clusters; c++) {
    for (let k = 0; k < 4; k++) {
      writeFact({
        tier: 'P', type: 'project',
        slug: `topic-${c}-note-${k}`,
        title: `Topic ${c} note ${k}`,
        body: `topic${c}alpha topic${c}beta topic${c}gamma topic${c}delta variant${k} detail${k}x detail${k}y`,
        writeSource: 'auto-extract', trust: 'medium',
        sourceFile: 'test', sourceLine: 1, sourceSha1: 'seed',
        autoLink: false, projectRoot, userDir,
      });
    }
  }
  for (let i = 0; i < filler; i++) {
    writeFact({
      tier: 'P', type: 'project',
      slug: `filler-${i}`, title: `Filler ${i}`,
      body: `f${i}w0 f${i}w1 f${i}w2 f${i}w3 f${i}w4 f${i}w5 f${i}w6`,
      writeSource: 'auto-extract', trust: 'medium',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'seed',
      autoLink: false, projectRoot, userDir,
    });
  }
  const db = openIndexDb({ projectRoot });
  reindexFull({ projectRoot, userDir, db });
  writeLinkFloor(db, 'jaccard', {
    backend: 'jaccard', floor: 0.15, median: 0.01, max: 0.9,
    quantile: FLOOR_QUANTILE, pairs: 500, sampledItems: 36, corpusSize: 36,
    computedAt: new Date().toISOString(),
  });
  db.close();
}

describe('Task 262 — the backfill (Doors 1, 2, 5)', () => {
  it('G1 --dry-run reports what WOULD link and writes absolutely nothing', () => {
    seedClusteredCorpus();
    const before = snapshotFactFiles();
    const auditBefore = auditLines().length;

    const r = linkBackfill({ projectRoot, userDir, tier: 'P', dryRun: true });

    expect(r.dryRun).toBe(true);
    expect(r.evaluated).toBeGreaterThan(0);
    expect(r.wouldLink).toBeGreaterThan(0);
    expect(Array.isArray(r.samples)).toBe(true);

    const after = snapshotFactFiles();
    expect(after.size).toBe(before.size);
    for (const [name, content] of before) expect(after.get(name)).toBe(content);
    expect(auditLines().length).toBe(auditBefore);

    // No resume markers persisted either — a dry run must be re-runnable.
    const db = openIndexDb({ projectRoot });
    try {
      const n = db.prepare('SELECT COUNT(*) AS n FROM link_eval').get().n;
      expect(n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('G2 a wet run links facts inside their cluster and audits each with mode:backfill', () => {
    seedClusteredCorpus();
    const r = linkBackfill({ projectRoot, userDir, tier: 'P' });

    expect(r.dryRun).toBe(false);
    expect(r.linked).toBeGreaterThan(0);
    expect(r.edges).toBeGreaterThanOrEqual(r.linked);

    const entries = auditLines().filter((e) => e.action === 'auto-linked');
    expect(entries.length).toBe(r.linked);
    for (const e of entries) {
      expect(e.extra.mode).toBe('backfill');
      expect(e.extra.links.length).toBeGreaterThan(0);
      expect(e.extra.links.length).toBeLessThanOrEqual(3);
    }

    // Every applied link points inside the writer's own topical cluster.
    const files = snapshotFactFiles();
    for (const [name, content] of files) {
      const m = content.match(/^related:\s*\[(.+)\]$/m);
      if (!m) continue;
      const topic = name.match(/topic-(\d+)-/)?.[1];
      expect(topic, `${name} gained links but is not a clustered fact`).toBeTruthy();
      for (const slug of m[1].split(',').map((s) => s.trim())) {
        expect(slug.startsWith(`topic-${topic}-`), `${name} → ${slug} crossed clusters`).toBe(true);
      }
    }
  });

  it('G3 is bounded per run and reports what remains (ADR-0020)', () => {
    seedClusteredCorpus();
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });
    expect(total).toBeGreaterThan(5);

    const r = linkBackfill({ projectRoot, userDir, tier: 'P', max: 5 });
    expect(r.evaluated).toBe(5);
    expect(r.remaining).toBe(total - 5);
  });

  it('G4 RESUMES from the artifacts — a killed run loses nothing and redoes nothing', () => {
    seedClusteredCorpus();
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });

    const first = linkBackfill({ projectRoot, userDir, tier: 'P', max: 6 });
    expect(first.evaluated).toBe(6);

    // The second run picks up EXACTLY where the first stopped.
    const second = linkBackfill({ projectRoot, userDir, tier: 'P', max: 6 });
    expect(second.evaluated).toBe(Math.min(6, total - 6));
    expect(second.alreadyDone).toBe(6);
  });

  it('G5 is idempotent — a completed corpus re-runs to a no-op', () => {
    seedClusteredCorpus();
    let guard = 0;
    while (countLinkBackfillPending({ projectRoot, userDir, tier: 'P' }) > 0 && guard++ < 20) {
      linkBackfill({ projectRoot, userDir, tier: 'P', max: 50 });
    }
    const before = snapshotFactFiles();
    const again = linkBackfill({ projectRoot, userDir, tier: 'P', max: 50 });
    expect(again.evaluated).toBe(0);
    expect(again.linked).toBe(0);
    const after = snapshotFactFiles();
    for (const [name, content] of before) expect(after.get(name)).toBe(content);
  });

  it('G6 OVER-MUTATION GUARD — a one-fact run edits exactly one file', () => {
    seedClusteredCorpus();
    const before = snapshotFactFiles();
    const r = linkBackfill({ projectRoot, userDir, tier: 'P', max: 1 });
    expect(r.evaluated).toBe(1);
    const after = snapshotFactFiles();
    expect(after.size).toBe(before.size);
    let changed = 0;
    for (const [name, content] of before) {
      if (after.get(name) !== content) changed++;
    }
    expect(changed).toBe(r.linked); // 0 or 1 — never more
    expect(changed).toBeLessThanOrEqual(1);
  });

  it('G7 the resume marker lives in the rebuildable INDEX, never as a tier sidecar', () => {
    seedClusteredCorpus();
    const tierFilesBefore = readdirSync(join(projectRoot, 'context')).sort();
    linkBackfill({ projectRoot, userDir, tier: 'P', max: 50 });
    expect(readdirSync(join(projectRoot, 'context')).sort()).toEqual(tierFilesBefore);

    const db = openIndexDb({ projectRoot });
    try {
      const rows = db.prepare('SELECT id, content_sha, backend FROM link_eval').all();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.id).toMatch(/^P-/);
        expect(typeof row.content_sha).toBe('string');
        expect(row.backend).toBe('jaccard');
      }
    } finally {
      db.close();
    }
  });

  it('G10 --max rejects a non-numeric or non-positive bound instead of walking unbounded', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const before = snapshotFactFiles();
    for (const bad of ['abc', '0', '-5', '2.5']) {
      const errs = [];
      const r = await runAutolink(
        { apply: true, max: bad },
        null,
        { projectRoot, userDir, log: () => {}, logError: (m) => errs.push(m) },
      );
      // `Number('abc')` is NaN and `considered >= NaN` is always false — the
      // pre-fix behaviour turned a typo into an UNBOUNDED walk.
      expect(r.action, `--max ${bad} was accepted`).toBe('error');
    }
    const after = snapshotFactFiles();
    for (const [name, content] of before) expect(after.get(name)).toBe(content);
  });

  it('G11 --apply --dry-run together resolve to the SAFE reading, never the destructive one', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const before = snapshotFactFiles();
    const lines = [];
    const r = await runAutolink(
      { apply: true, dryRun: true },
      null,
      { projectRoot, userDir, log: (m) => lines.push(m) },
    );
    expect(r.dryRun).toBe(true);
    expect(r.linked).toBe(0);
    const after = snapshotFactFiles();
    for (const [name, content] of before) expect(after.get(name)).toBe(content);
    expect(lines.join(' ')).toMatch(/contradict/i);
  });

  it('G12 a fact whose write FAILS is not counted as linked, and is recorded as evaluated (M7/M8)', () => {
    seedClusteredCorpus();
    // Make one linkable fact READ-ONLY: it still parses (so it is a real
    // candidate and the linker decides to write it), and the write then throws
    // EPERM/EACCES — the shape a virus scanner or a locked file produces.
    const victimName = readdirSync(factDir()).find((f) => /^project_topic-0-note-\d\.md$/.test(f));
    expect(victimName).toBeTruthy();
    const victimPath = join(factDir(), victimName);

    let r;
    try {
      chmodSync(victimPath, 0o444);
      r = linkBackfill({ projectRoot, userDir, tier: 'P', max: 100 });
    } finally {
      chmodSync(victimPath, 0o644);
    }

    // The run completed rather than throwing, and reported the failure.
    expect(r.action).not.toBe('error');
    expect(r.failed).toBeGreaterThan(0);
    // `linked` counts writes that LANDED, so it never includes the failure.
    expect(r.linked).toBeLessThan(r.wouldLink);
  });

  it('G9 the SHIPPED verb is a dry run unless --apply is passed (the 2026-08-08 incident)', async () => {
    seedClusteredCorpus();
    const before = snapshotFactFiles();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const lines = [];

    // Bare invocation — exactly what the scaffold smoke test ran against the
    // maintainer's real corpus, and what a user gets from typing the verb name.
    const dry = await runAutolink({}, null, { projectRoot, userDir, log: (m) => lines.push(m) });
    expect(dry.dryRun).toBe(true);
    expect(dry.linked).toBe(0);
    expect(dry.wouldLink).toBeGreaterThan(0);
    const afterDry = snapshotFactFiles();
    for (const [name, content] of before) expect(afterDry.get(name)).toBe(content);
    expect(lines.join(' ')).toContain('--apply');

    // ...and --apply is what actually writes.
    const wet = await runAutolink({ apply: true }, null, { projectRoot, userDir, log: () => {} });
    expect(wet.dryRun).toBe(false);
    expect(wet.linked).toBeGreaterThan(0);
    const afterWet = snapshotFactFiles();
    let changed = 0;
    for (const [name, content] of before) if (afterWet.get(name) !== content) changed++;
    expect(changed).toBe(wet.linked);
  });

  it('G8 never touches a fact that already carries links (artifact-derived skip)', () => {
    seedClusteredCorpus();
    const explicit = writeFact({
      tier: 'P', type: 'project', slug: 'hand-linked',
      title: 'Hand linked',
      body: 'topic0alpha topic0beta topic0gamma topic0delta variant9 detail9x detail9y',
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'seed',
      related: ['topic-0-note-0'],
      projectRoot, userDir,
    });
    const beforeText = readFileSync(explicit.path, 'utf8');
    linkBackfill({ projectRoot, userDir, tier: 'P', max: 100 });
    expect(readFileSync(explicit.path, 'utf8')).toBe(beforeText);
  });
});

// ---------------------------------------------------------------------------
// Task 262 follow-up — THE BOUND IS A RECOVERY PROPERTY, NOT A UX.
//
// `cmk autolink --apply` shipped processing ONE bounded batch and printing
// "1,895 fact(s) remain — re-run to continue", which makes the human the loop
// driver for a job the machine knows how to finish. ADR-0020's resumability is
// about surviving a kill; it was never a reason to hand the user a crank.
//
// So: the verb LOOPS its own bounded batches to completion, each batch still
// committing durably exactly as before (killed-at-80% still loses nothing —
// every test above still holds against the single-batch primitive), `--max`
// becomes the explicit bounded-slice opt-in, and the index sync the user was
// doing by hand afterwards happens in-band (the D-85 contract: the action
// completes; the regular user runs no follow-up command).
// ---------------------------------------------------------------------------
describe('Task 262 follow-up — one invocation finishes the job (Doors 1, 2, 5)', () => {
  function relatedEdgeCount() {
    const db = openIndexDb({ projectRoot });
    try {
      return db.prepare("SELECT COUNT(*) AS n FROM edges WHERE type = 'related'").get().n;
    } finally {
      db.close();
    }
  }

  it('G13 linkBackfillToCompletion LOOPS bounded batches until nothing remains', () => {
    seedClusteredCorpus();
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });
    expect(total).toBeGreaterThan(10); // more than one batch at batchSize 5

    const r = linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: 5 });

    // Door 1 — the aggregate is the WHOLE job, not the first slice.
    expect(r.batches).toBeGreaterThan(1);
    expect(r.evaluated).toBe(total);
    expect(r.remaining).toBe(0);
    expect(r.stopped).toBe('complete');
    expect(r.linked).toBeGreaterThan(0);
    expect(r.edges).toBeGreaterThanOrEqual(r.linked);
    expect(r.bands.related + r.bands.none).toBe(total);

    // Door 2 — the corpus really is finished, by the same derivation a fresh
    // process would use.
    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBe(0);

    // Door 5 — one audit entry per linked fact, across every batch.
    const entries = auditLines().filter((e) => e.action === 'auto-linked');
    expect(entries.length).toBe(r.linked);
  });

  it('G14 `cmk autolink --apply` with no --max finishes in ONE invocation and says so', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });
    const lines = [];

    const r = await runAutolink(
      { apply: true },
      null,
      { projectRoot, userDir, batchSize: 5, log: (m) => lines.push(m) },
    );

    expect(r.evaluated).toBe(total);
    expect(r.remaining).toBe(0);
    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBe(0);

    const out = lines.join('\n');
    // Per-batch progress, not silence for the whole run.
    expect(out).toMatch(/batch 2/);
    // ...and the final word is what happened, never a crank to turn.
    expect(out).not.toMatch(/re-run to continue/);
    expect(out).toMatch(/nothing remains/);
  });

  it('G15 --max is the explicit bounded slice — one batch, and it says what remains', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });
    const lines = [];

    const r = await runAutolink(
      { apply: true, max: 5 },
      null,
      { projectRoot, userDir, log: (m) => lines.push(m) },
    );

    expect(r.evaluated).toBe(5);
    expect(r.remaining).toBe(total - 5);
    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBe(total - 5);
    expect(lines.join('\n')).toMatch(/re-run to continue/);
  });

  it('G16 a completed apply run leaves the EDGES live — no manual `cmk reindex --boot`', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    // The seed's reindexFull built the edge table when no fact had links yet.
    expect(relatedEdgeCount()).toBe(0);
    const lines = [];

    const r = await runAutolink(
      { apply: true },
      null,
      { projectRoot, userDir, batchSize: 5, log: (m) => lines.push(m) },
    );

    expect(r.linked).toBeGreaterThan(0);
    // Door 2 — read the index in a FRESH connection that does no reindexing of
    // its own: the rows are there because the run put them there.
    expect(relatedEdgeCount()).toBe(r.edges);
    expect(r.indexSynced).toBe(true);
    expect(lines.join('\n')).toMatch(/index synced/i);
  });

  it('G17 the DRY RUN loops too — full picture, still absolutely zero writes', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });
    const before = snapshotFactFiles();
    const auditBefore = auditLines().length;
    const edgesBefore = relatedEdgeCount();

    const r = await runAutolink(
      {},
      null,
      { projectRoot, userDir, batchSize: 5, log: () => {} },
    );

    // A dry run that stopped at the first batch would under-report the corpus.
    expect(r.dryRun).toBe(true);
    expect(r.evaluated).toBe(total);
    expect(r.remaining).toBe(0);
    expect(r.batches).toBeGreaterThan(1);

    // ...and it is still the no-write posture, every batch of it.
    const after = snapshotFactFiles();
    expect(after.size).toBe(before.size);
    for (const [name, content] of before) expect(after.get(name)).toBe(content);
    expect(auditLines().length).toBe(auditBefore);
    expect(relatedEdgeCount()).toBe(edgesBefore);
    expect(r.indexSynced).toBe(false);
    const db = openIndexDb({ projectRoot });
    try {
      expect(db.prepare('SELECT COUNT(*) AS n FROM link_eval').get().n).toBe(0);
    } finally {
      db.close();
    }
  });

  it('G18 an interrupted run resumes on the next invocation and SAYS so', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    // Stand in for a Ctrl-C mid-run: a bounded slice landed, durably.
    const first = await runAutolink(
      { apply: true, max: 5 },
      null,
      { projectRoot, userDir, log: () => {} },
    );
    expect(first.evaluated).toBe(5);

    const lines = [];
    const second = await runAutolink(
      { apply: true },
      null,
      { projectRoot, userDir, batchSize: 5, log: (m) => lines.push(m) },
    );

    expect(second.alreadyDone).toBeGreaterThan(0);
    expect(second.remaining).toBe(0);
    expect(lines.join('\n')).toMatch(/resum/i);
  });
});

// ---------------------------------------------------------------------------
// Review pass on the loop — B1 (Blocking) and the Important/Minor findings.
//
// B1, THE ONE THAT MATTERS. `autoLinkFact` has two DEGENERACY GUARDS: a floor
// at or above the calibrated near-dup ceiling, and a floor at or below the
// random-pair median. Both mean "this distribution cannot separate a
// relationship from noise", and both return zero links **with a non-null
// floor**. The backfill read that as the ordinary "nothing above the floor"
// band and wrote a `link_eval` marker for every fact — so ONE invocation of the
// looping verb marked the WHOLE corpus as considered and reported "nothing
// remains — the corpus is fully considered."
//
// And the escape hatch was fiction: `link_eval` is keyed by (id, content_sha),
// so an unedited fact is never re-considered, and `reindexFull` did NOT drop the
// table despite the module header promising exactly that. A degenerate floor
// therefore poisoned the corpus permanently, with no command to undo it.
//
// Both halves are fixed and both are pinned here: (a) a degenerate batch marks
// NOTHING and stops with a named reason; (b) `reindexFull` really does drop
// `link_eval`, so the documented recovery exists — including for anyone who
// already ran the poisoning version.
// ---------------------------------------------------------------------------
describe('Task 262 follow-up — the review findings (Doors 1, 2, 5)', () => {
  /** Force a floor that is at or above the jaccard near-dup ceiling (0.5). */
  function seedDegenerateFloorAboveNearDup() {
    seedClusteredCorpus();
    const db = openIndexDb({ projectRoot });
    writeLinkFloor(db, 'jaccard', {
      backend: 'jaccard', floor: 0.62, median: 0.01, max: 0.95,
      quantile: FLOOR_QUANTILE, pairs: 500, sampledItems: 36, corpusSize: 36,
      computedAt: new Date().toISOString(),
    });
    db.close();
  }

  /** Force a FLAT distribution — the p99 and the median coincide. */
  function seedDegenerateFlatDistribution() {
    seedClusteredCorpus();
    const db = openIndexDb({ projectRoot });
    writeLinkFloor(db, 'jaccard', {
      backend: 'jaccard', floor: 0.22, median: 0.30, max: 0.35,
      quantile: FLOOR_QUANTILE, pairs: 500, sampledItems: 36, corpusSize: 36,
      computedAt: new Date().toISOString(),
    });
    db.close();
  }

  function linkEvalRows() {
    const db = openIndexDb({ projectRoot });
    try {
      return db.prepare('SELECT id FROM link_eval').all();
    } catch {
      return []; // table dropped — that is a legitimate answer here
    } finally {
      db.close();
    }
  }

  function auditActions(action) {
    return auditLines().filter((e) => e.action === action);
  }

  it('B1a a floor ABOVE the near-dup ceiling marks NOTHING and stops with the reason', () => {
    seedDegenerateFloorAboveNearDup();
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });
    const before = snapshotFactFiles();

    const r = linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: 5 });

    // Door 1 — it REFUSES, by name, instead of reporting a finished corpus.
    expect(r.degenerate).toBe('floor-above-neardup');
    expect(r.stopped).toBe('degenerate-floor');
    expect(r.linked).toBe(0);
    expect(r.batches).toBe(1); // stops immediately — the floor is corpus-wide

    // Door 2 — NOTHING was marked, so the corpus is exactly as re-considerable
    // as it was before. This is the whole finding.
    expect(linkEvalRows().length).toBe(0);
    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBe(total);
    const after = snapshotFactFiles();
    for (const [name, content] of before) expect(after.get(name)).toBe(content);
  });

  it('B1a a FLAT distribution is the same refusal, with its own reason', () => {
    seedDegenerateFlatDistribution();
    const total = countLinkBackfillPending({ projectRoot, userDir, tier: 'P' });

    const r = linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: 5 });

    expect(r.degenerate).toBe('flat-distribution');
    expect(r.stopped).toBe('degenerate-floor');
    expect(linkEvalRows().length).toBe(0);
    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBe(total);
  });

  it('B1a the DRY RUN refuses too — the report must not claim a finished corpus', () => {
    seedDegenerateFloorAboveNearDup();
    const r = linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: 5, dryRun: true });
    expect(r.degenerate).toBe('floor-above-neardup');
    expect(r.stopped).toBe('degenerate-floor');
    expect(r.wouldLink).toBe(0);
  });

  it('B1a the VERB names the reason, exits non-zero, and never says "fully considered"', async () => {
    seedDegenerateFloorAboveNearDup();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    // A refusal is an error condition, so it goes to stderr — both streams are
    // captured here so the assertion is about WHAT is said, not which pipe.
    const lines = [];
    process.exitCode = 0;

    const r = await runAutolink(
      { apply: true },
      null,
      { projectRoot, userDir, batchSize: 5, log: (m) => lines.push(m), logError: (m) => lines.push(m) },
    );

    expect(r.degenerate).toBe('floor-above-neardup');
    expect(process.exitCode).not.toBe(0);
    const out = lines.join('\n');
    expect(out).toMatch(/floor-above-neardup/);
    expect(out).not.toMatch(/fully considered/);
    // ...and no progress line in front of the refusal: a batch that considered
    // nothing must not print as though a pass happened.
    expect(out).not.toMatch(/batch 1/);
    expect(linkEvalRows().length).toBe(0);
  });

  it('B1b `reindexFull` DROPS link_eval — the documented recovery is real', () => {
    seedClusteredCorpus();
    // A normal run lays down markers...
    linkBackfill({ projectRoot, userDir, tier: 'P', max: 10 });
    expect(linkEvalRows().length).toBeGreaterThan(0);

    // ...and a FULL reindex is what clears them. The module header always
    // claimed this ("losing it to a full reindex costs a re-consideration");
    // until now the table simply survived, so a poisoned corpus had no repair.
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
    } finally {
      db.close();
    }
    expect(linkEvalRows().length).toBe(0);
  });

  it('B1b after the reindexFull repair, a poisoned corpus is fully re-considerable', () => {
    seedDegenerateFloorAboveNearDup();
    // Simulate the pre-fix damage exactly: every fact marked as considered,
    // against its REAL content sha — a marker with the wrong sha suppresses
    // nothing, so the poisoning has to be faithful for the test to mean anything.
    const db0 = openIndexDb({ projectRoot });
    db0.exec(`CREATE TABLE IF NOT EXISTS link_eval (
      id TEXT PRIMARY KEY, content_sha TEXT NOT NULL,
      backend TEXT NOT NULL, evaluated_at TEXT NOT NULL);`);
    for (const fact of eachLiveFact({ projectRoot, userDir, tiers: ['P'] })) {
      db0
        .prepare('INSERT OR REPLACE INTO link_eval VALUES (?,?,?,?)')
        .run(fact.id, hashContent(fact.body ?? ''), 'jaccard', new Date().toISOString());
    }
    db0.close();
    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBe(0); // poisoned

    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      // A real repair also re-derives a usable floor; put the good one back the
      // way the seed does, since reindexFull recomputes from this small corpus.
      writeLinkFloor(db, 'jaccard', {
        backend: 'jaccard', floor: 0.15, median: 0.01, max: 0.9,
        quantile: FLOOR_QUANTILE, pairs: 500, sampledItems: 36, corpusSize: 36,
        computedAt: new Date().toISOString(),
      });
    } finally {
      db.close();
    }

    expect(countLinkBackfillPending({ projectRoot, userDir, tier: 'P' })).toBeGreaterThan(10);
    const r = linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: 5 });
    expect(r.linked).toBeGreaterThan(0);
  });

  it('I5 the dry-run cursor is IGNORED on a wet run (the silent-skip hazard)', () => {
    seedClusteredCorpus();
    // Every id in the corpus, handed in as if it were an advanced cursor. On a
    // WET run this must be ignored: honoring it would silently skip facts the
    // run exists to write. A refactor that drops the `dryRun ?` guard fails here.
    const db = openIndexDb({ projectRoot });
    const allIds = db.prepare('SELECT id FROM observations').all().map((r) => r.id);
    db.close();

    const r = linkBackfill({
      projectRoot, userDir, tier: 'P', max: 3,
      dryRunSeen: new Set(allIds),
    });
    expect(r.evaluated).toBe(3);
  });

  it('M8 the dry-run cursor survives a corpus that GROWS between batches', () => {
    seedClusteredCorpus();
    const seen = new Set();
    const first = linkBackfill({ projectRoot, userDir, tier: 'P', max: 4, dryRun: true, dryRunSeen: seen });
    expect(first.evaluated).toBe(4);
    expect(seen.size).toBe(4);

    // A fact arrives mid-run (auto-extract never stops for a maintenance verb).
    writeFact({
      tier: 'P', type: 'project', slug: 'arrived-mid-run',
      title: 'Arrived mid run',
      body: 'topic0alpha topic0beta topic0gamma topic0delta variant7 detail7x detail7y',
      writeSource: 'auto-extract', trust: 'medium',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'seed',
      autoLink: false, projectRoot, userDir,
    });

    const second = linkBackfill({ projectRoot, userDir, tier: 'P', max: 100, dryRun: true, dryRunSeen: seen });
    // An INDEX cursor would have mis-paged here. An id set cannot: nothing seen
    // is re-considered, and the newcomer is not skipped.
    expect(second.evaluated).toBeGreaterThan(0);
    const consideredTwice = [...seen].length;
    expect(consideredTwice).toBe(first.evaluated + second.evaluated);
    expect(second.remaining).toBe(0);
  });

  it('I5/I6 a STALLED loop is named, recorded, and exits non-zero', async () => {
    seedClusteredCorpus();
    // Injected batch: claims work remains but never makes progress — the shape
    // the loop must refuse to spin on.
    const stuck = () => ({
      tier: 'P', backend: 'jaccard', floor: 0.15, evaluated: 0,
      linked: 0, wouldLink: 0, edges: 0, wouldAddEdges: 0,
      failed: 0, failures: [], alreadyDone: 0, remaining: 12,
      nearDupBand: 0, bands: { related: 0, nearDup: 0, none: 0 },
      dryRun: false, samples: [],
    });

    const r = linkBackfillToCompletion({
      projectRoot, userDir, tier: 'P', batchSize: 5, _runBatch: stuck,
    });
    expect(r.stopped).toBe('stalled');
    expect(r.remaining).toBe(12);

    // Door 5 — "if this repeats please report it" must leave something to report.
    const entries = auditActions('backfill-incomplete');
    expect(entries.length).toBe(1);
    expect(entries[0].extra.stopped).toBe('stalled');
    expect(entries[0].extra.remaining).toBe(12);
  });

  it('I5 a BATCH-CAP stop is named too (progress, but never finishing)', () => {
    seedClusteredCorpus();
    // Always one more batch's worth left, however many batches run.
    let n = 0;
    const neverEnding = () => {
      n += 1;
      return {
        tier: 'P', backend: 'jaccard', floor: 0.15, evaluated: 5,
        linked: 1, wouldLink: 1, edges: 1, wouldAddEdges: 1,
        failed: 0, failures: [], alreadyDone: 0, remaining: 1000 - n,
        nearDupBand: 0, bands: { related: 1, nearDup: 0, none: 4 },
        dryRun: false, samples: [],
      };
    };

    const r = linkBackfillToCompletion({
      projectRoot, userDir, tier: 'P', batchSize: 5, _runBatch: neverEnding,
    });
    expect(r.stopped).toBe('batch-cap');
    expect(r.batches).toBeLessThan(500); // bounded, not spinning
    expect(auditActions('backfill-incomplete').length).toBe(1);
  });

  it('M7 a corpus with NO derivable floor stops as `no-floor`, not as `complete`', () => {
    // install() alone: too few facts for a floor to mean anything.
    const r = linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: 5 });
    expect(r.floor).toBeNull();
    expect(r.stopped).toBe('no-floor');
  });

  it('M11 an invalid injected batchSize is rejected, never treated as "no bound"', () => {
    seedClusteredCorpus();
    for (const bad of [0, -3, 2.5, Number.NaN, 'abc']) {
      expect(
        () => linkBackfillToCompletion({ projectRoot, userDir, tier: 'P', batchSize: bad }),
        `batchSize ${String(bad)} was accepted`,
      ).toThrow(/batchSize/);
    }
  });

  it('I4 a FAILED index sync is surfaced with its error, not papered over', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const lines = [];

    const r = await runAutolink(
      { apply: true },
      null,
      {
        projectRoot, userDir, batchSize: 50, log: (m) => lines.push(m),
        syncIndex: () => ({ synced: false, edgeCount: 0, filesReindexed: 0, error: 'SQLITE_BUSY: database is locked' }),
      },
    );

    expect(r.indexSynced).toBe(false);
    expect(r.indexSyncError).toMatch(/SQLITE_BUSY/);
    const out = lines.join('\n');
    expect(out).toMatch(/SQLITE_BUSY/); // the actual reason, not fixed reassurance
    // Door 5 — a durable record, same discipline as reindexBoot's own.
    const entries = auditActions('index-rebuild-failed');
    expect(entries.length).toBe(1);
    expect(entries[0].extra.error).toMatch(/SQLITE_BUSY/);
  });

  it('I4 the real sync reports its own error rather than throwing', () => {
    // A projectRoot that cannot host an index: the path is a FILE.
    const bogus = join(sandbox, 'not-a-project');
    writeFileSync(bogus, 'i am a file', 'utf8');
    const s = syncIndexAfterBackfill({ projectRoot: bogus, userDir });
    expect(s.synced).toBe(false);
    expect(typeof s.error).toBe('string');
    expect(s.error.length).toBeGreaterThan(0);
  });

  it('I3/M10 the sync line separates THIS RUN\'s edges from the whole graph', async () => {
    seedClusteredCorpus();
    const { runAutolink } = await import('../packages/cli/src/subcommands.mjs');
    const lines = [];

    const r = await runAutolink(
      { apply: true },
      null,
      { projectRoot, userDir, batchSize: 50, log: (m) => lines.push(m) },
    );

    const syncLine = lines.find((l) => /index synced/i.test(l));
    expect(syncLine).toBeTruthy();
    // The run's own number is named as the run's...
    expect(syncLine).toContain(String(r.edges));
    // ...and the graph total is labelled as covering every edge type, so the
    // two numbers can never read as one unexplained gap.
    expect(syncLine).toMatch(/all types|of every type/i);
  });
});
