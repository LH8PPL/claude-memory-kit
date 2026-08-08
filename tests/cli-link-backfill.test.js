// @doors: 1, 2, 5
// Door 1: the run report — evaluated / linked / edges / remaining / bands, and
//   the dry-run's identical shape with zero writes.
// Door 2: the STATE — `related:` appended to exactly the facts that earned it,
//   the `link_eval` resume markers inside the rebuildable INDEX (never a
//   sidecar file in the tier), and the over-mutation guard.
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
import { mkdtempSync, rmSync, readFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { linkBackfill, countLinkBackfillPending } from '../packages/cli/src/link-backfill.mjs';
import { writeLinkFloor, FLOOR_QUANTILE } from '../packages/cli/src/link-facts.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
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
