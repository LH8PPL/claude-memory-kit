// @doors: 1, 2, 5
// Door 1: every public boundary's return shape (floor record, band split, cap,
//   flag resolution, writeFact's result under a linker failure).
// Door 2: the STATE — `related:` frontmatter on the new fact file, the
//   `meta` floor row + `link_eval` marker in the index, the conflict-queue
//   file, and the over-mutation guard (N-1 pre-existing files byte-identical).
// Door 3 N/A: no subprocess. The semantic backend is an injected similarityFn
//   seam here exactly as Task 143 does; the real-embedder path is the
//   live-test recorded in the task report.
// Door 4 N/A: no message queue (the conflict queue is a FILE — Door-2 state).
// Door 5: the `auto-linked` audit NDJSON entry — action, both ids, band,
//   score, backend, floor (the observability the task's flag/A-B relies on).
//
// Task 262 sub-task 2 — WRITE-TIME FACT LINKING.
//
// The corpus is 2,220 facts with 4.0% linked, because `writeFact` has accepted
// a `related` option since Task 7 and nothing ever passed it. This is the
// mechanism that passes it: at write time the new fact is scored against the
// live corpus, and the three bands settled in the Task-262 grill are applied —
// near-duplicate → the conflict queue (a human decides), related → auto-apply
// up to the cap, below the floor → nothing.
//
// The floor is the part that must not become a constant. It is DERIVED from
// this corpus + this backend's own random-pair distribution at index time
// (the research: 0.78 is only meaningful relative to bge-base's random-pair
// p99 of 0.773 — swap the model and the number means nothing).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  LINK_CAP,
  MIN_FLOOR_ITEMS,
  FLOOR_QUANTILE,
  computeLinkFloor,
  readLinkFloor,
  writeLinkFloor,
  selectLinkCandidates,
  linkingEnabled,
  autoLinkFact,
  makeCachedCosineBackend,
} from '../packages/cli/src/link-facts.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
import { traverseLinks } from '../packages/cli/src/graph-index.mjs';
import { tokenJaccardSimilarity } from '../packages/cli/src/conflict-queue.mjs';
import { embeddingCacheKey } from '../packages/cli/src/semantic-backend.mjs';
import { install } from '../packages/cli/src/install.mjs';

let sandbox;
let projectRoot;
let userDir;

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-linkfacts-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
  delete process.env.CMK_LINK_FACTS;
});

afterEach(() => {
  delete process.env.CMK_LINK_FACTS;
  rmSync(sandbox, { recursive: true, force: true });
});

// --- helpers ---------------------------------------------------------------

const factDir = () => join(projectRoot, 'context', 'memory');

/** Write a fact through the REAL writer with auto-linking OFF (fixture seeding). */
function seedFact({ slug, title, body, tier = 'P', related }) {
  return writeFact({
    tier,
    type: 'project',
    slug,
    title,
    body,
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'test',
    sourceLine: 1,
    sourceSha1: 'seed',
    related,
    autoLink: false,
    projectRoot,
    userDir,
  });
}

/**
 * Byte-snapshot every FACT file in the project tier.
 *
 * Only `<type>_<slug>.md` files count. The tier's DERIVED views — INDEX.md
 * (Task 85) and MAP.md (the Obsidian vault map, Task 254) — are rewritten by
 * every create by contract; the over-mutation guard is about the durable fact
 * files, which a link write must leave byte-identical.
 */
const FACT_FILE_RE = /^(user|feedback|project|reference|judgment)_.+\.md$/;
function snapshotFactFiles() {
  const dir = factDir();
  const out = new Map();
  for (const name of readdirSync(dir)) {
    if (!FACT_FILE_RE.test(name)) continue;
    out.set(name, readFileSync(join(dir, name), 'utf8'));
  }
  return out;
}

/**
 * Pin a linking floor in the index.
 *
 * Used by the integration tests so they depend on ONE contract (the write path)
 * rather than two — floor DERIVATION has its own boundary in the A-block, and a
 * test coupled to both fails for two unrelated reasons and pins neither.
 */
function pinFloor(db, floor = 0.15) {
  writeLinkFloor(db, 'jaccard', {
    backend: 'jaccard',
    floor,
    median: floor / 5,
    max: 0.9,
    quantile: FLOOR_QUANTILE,
    pairs: 500,
    sampledItems: 40,
    corpusSize: 40,
    computedAt: new Date().toISOString(),
  });
}

/** Merge keys into the project tier's settings.json, preserving siblings. */
function writeSettings(patch) {
  const p = join(projectRoot, 'context', 'settings.json');
  const cur = existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
  writeFileSync(p, JSON.stringify({ ...cur, ...patch }, null, 2), 'utf8');
}

function auditLines() {
  const p = join(projectRoot, 'context', '.locks', 'audit.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

/**
 * A deterministic corpus of `n` facts whose bodies share a controllable amount
 * of vocabulary, so token-Jaccard scores are predictable without an embedder.
 */
function vocabBody(i, sharedWords) {
  const shared = Array.from({ length: sharedWords }, (_, k) => `shared${k}`).join(' ');
  const unique = Array.from({ length: 12 }, (_, k) => `u${i}w${k}`).join(' ');
  return `${shared} ${unique}`;
}

// --- A. The floor is DERIVED, never a constant -----------------------------

describe('Task 262 — the related-band floor is computed from the corpus (Door 1 + 2)', () => {
  it('A1 refuses to derive a floor from too few items (honest null, not a guess)', () => {
    const items = Array.from({ length: MIN_FLOOR_ITEMS - 1 }, (_, i) => ({
      id: `P-AAAAAA${i}A`.slice(0, 10), // validate-test-ids: ignore
      text: vocabBody(i, 2),
    }));
    expect(computeLinkFloor({ items, similarityFn: tokenJaccardSimilarity })).toBeNull();
  });

  it('A2 returns a floor at the configured quantile with full provenance, deterministically', () => {
    const items = Array.from({ length: 60 }, (_, i) => ({ id: `k${i}`, text: vocabBody(i, i % 5) }));
    const a = computeLinkFloor({ items, similarityFn: tokenJaccardSimilarity });
    const b = computeLinkFloor({ items, similarityFn: tokenJaccardSimilarity });

    expect(a).not.toBeNull();
    expect(a.quantile).toBe(FLOOR_QUANTILE);
    expect(a.pairs).toBeGreaterThan(0);
    expect(a.sampledItems).toBe(60);
    expect(a.floor).toBeGreaterThan(0);
    expect(a.floor).toBeLessThanOrEqual(1);
    // Deterministic: same corpus + same fn → identical floor (seeded sampling).
    expect(b.floor).toBe(a.floor);
  });

  it('A3 is corpus-dependent — a denser corpus yields a HIGHER random-pair floor', () => {
    const sparse = Array.from({ length: 60 }, (_, i) => ({ id: `s${i}`, text: vocabBody(i, 0) }));
    const dense = Array.from({ length: 60 }, (_, i) => ({ id: `d${i}`, text: vocabBody(i, 24) }));
    const fs_ = computeLinkFloor({ items: sparse, similarityFn: tokenJaccardSimilarity });
    const fd = computeLinkFloor({ items: dense, similarityFn: tokenJaccardSimilarity });
    expect(fd.floor).toBeGreaterThan(fs_.floor);
  });

  it('A4 refreshLinkFloors stores the jaccard floor + provenance in the index meta table', () => {
    for (let i = 0; i < 40; i++) {
      seedFact({ slug: `floor-seed-${i}`, title: `Floor seed ${i}`, body: vocabBody(i, 3) });
    }
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      const rec = readLinkFloor(db, 'jaccard');
      expect(rec).not.toBeNull();
      expect(rec.backend).toBe('jaccard');
      expect(typeof rec.floor).toBe('number');
      expect(rec.quantile).toBe(FLOOR_QUANTILE);
      expect(rec.corpusSize).toBeGreaterThanOrEqual(40);
      expect(typeof rec.computedAt).toBe('string');
    } finally {
      db.close();
    }
  });

  it('A5 a full reindex RECOMPUTES the floor (derived state, ADR-0002)', () => {
    for (let i = 0; i < 40; i++) {
      seedFact({ slug: `recompute-${i}`, title: `Recompute ${i}`, body: vocabBody(i, 1) });
    }
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      const first = readLinkFloor(db, 'jaccard');
      // Add a much denser cohort, then rebuild: the floor must move.
      for (let i = 0; i < 40; i++) {
        seedFact({ slug: `recompute-dense-${i}`, title: `Dense ${i}`, body: vocabBody(i, 30) });
      }
      reindexFull({ projectRoot, userDir, db });
      const second = readLinkFloor(db, 'jaccard');
      expect(second.corpusSize).toBeGreaterThan(first.corpusSize);
      expect(second.floor).not.toBe(first.floor);
    } finally {
      db.close();
    }
  });
});

// --- B. The three bands + the cap ------------------------------------------

describe('Task 262 — three bands, cap 3 out-links (Door 1)', () => {
  function seedBandCorpus() {
    // 6 candidates at descending, controlled similarity to the probe text.
    seedFact({ slug: 'cand-a', title: 'Cand A', body: 'alpha beta gamma delta epsilon zeta' });
    seedFact({ slug: 'cand-b', title: 'Cand B', body: 'alpha beta gamma delta epsilon eta' });
    seedFact({ slug: 'cand-c', title: 'Cand C', body: 'alpha beta gamma delta theta iota' });
    seedFact({ slug: 'cand-d', title: 'Cand D', body: 'alpha beta gamma kappa lambda mu' });
    seedFact({ slug: 'cand-e', title: 'Cand E', body: 'alpha beta nu xi omicron pi' });
    seedFact({ slug: 'cand-f', title: 'Cand F', body: 'wholly unrelated vocabulary here now' });
    const db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });
    return db;
  }

  it('B1 auto-applies at most LINK_CAP links, highest score first', () => {
    const db = seedBandCorpus();
    try {
      const r = selectLinkCandidates({
        db,
        tier: 'P',
        text: 'alpha beta gamma delta epsilon zeta',
        similarityFn: tokenJaccardSimilarity,
        backend: 'jaccard',
        floor: 0.2,
        nearDupThreshold: 0.95,
      });
      expect(r.links.length).toBe(LINK_CAP);
      const scores = r.links.map((l) => l.score);
      expect([...scores].sort((a, b) => b - a)).toEqual(scores);
      for (const l of r.links) expect(typeof l.slug).toBe('string');
    } finally {
      db.close();
    }
  });

  it('B2 a near-dup-band candidate is NOT auto-linked — it goes to nearDups', () => {
    const db = seedBandCorpus();
    try {
      const r = selectLinkCandidates({
        db,
        tier: 'P',
        text: 'alpha beta gamma delta epsilon zeta',
        similarityFn: tokenJaccardSimilarity,
        backend: 'jaccard',
        floor: 0.2,
        nearDupThreshold: 0.5,
      });
      expect(r.nearDups.length).toBeGreaterThan(0);
      const dupIds = new Set(r.nearDups.map((d) => d.id));
      for (const l of r.links) expect(dupIds.has(l.id)).toBe(false);
      // A near-dup must not consume a link slot either.
      for (const l of r.links) expect(l.score).toBeLessThan(0.5);
    } finally {
      db.close();
    }
  });

  it('B3 below-floor candidates produce NO links (the budget pair: at-floor in, under-floor out)', () => {
    const db = seedBandCorpus();
    try {
      const probe = 'alpha beta gamma delta epsilon zeta';
      const all = selectLinkCandidates({
        db, tier: 'P', text: probe,
        similarityFn: tokenJaccardSimilarity, backend: 'jaccard',
        floor: 0, nearDupThreshold: 1.01,
      });
      const best = all.links[0].score;
      // AT the floor → included.
      const at = selectLinkCandidates({
        db, tier: 'P', text: probe,
        similarityFn: tokenJaccardSimilarity, backend: 'jaccard',
        floor: best, nearDupThreshold: 1.01,
      });
      expect(at.links.length).toBeGreaterThan(0);
      // OVER the floor (nothing can reach it) → nothing.
      const over = selectLinkCandidates({
        db, tier: 'P', text: probe,
        similarityFn: tokenJaccardSimilarity, backend: 'jaccard',
        floor: best + 1e-9 + 0.0001, nearDupThreshold: 1.01,
      });
      expect(over.links.length).toBe(0);
    } finally {
      db.close();
    }
  });

  it('B4 never links across tiers (a committed P fact must not reference a machine-local U slug)', () => {
    seedFact({ slug: 'p-side', title: 'P side', body: 'alpha beta gamma delta epsilon' });
    seedFact({ tier: 'U', slug: 'u-side', title: 'U side', body: 'alpha beta gamma delta epsilon' });
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      const r = selectLinkCandidates({
        db, tier: 'P', text: 'alpha beta gamma delta epsilon',
        similarityFn: tokenJaccardSimilarity, backend: 'jaccard',
        floor: 0.1, nearDupThreshold: 1.01,
      });
      const ids = r.links.map((l) => l.id);
      // The user tier's fact dir is `fragments/` (tier-paths.resolveFactDir),
      // NOT `memory/` — the asymmetry the first FACT_SOURCE_RE walked past.
      const uRow = db.prepare("SELECT id FROM observations WHERE tier = 'U' AND source_file LIKE 'fragments/%'").get();
      expect(uRow).toBeTruthy();
      expect(ids).not.toContain(uRow.id);
    } finally {
      db.close();
    }
  });

  it('B5 excludes the writing fact itself (no self-link)', () => {
    const r0 = seedFact({ slug: 'self', title: 'Self', body: 'alpha beta gamma delta epsilon zeta' });
    seedFact({ slug: 'other', title: 'Other', body: 'alpha beta gamma delta epsilon eta' });
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      const r = selectLinkCandidates({
        db, tier: 'P', text: 'alpha beta gamma delta epsilon zeta', excludeId: r0.id,
        similarityFn: tokenJaccardSimilarity, backend: 'jaccard',
        floor: 0.1, nearDupThreshold: 1.01,
      });
      expect(r.links.map((l) => l.id)).not.toContain(r0.id);
    } finally {
      db.close();
    }
  });
});

// --- C. The flag -----------------------------------------------------------

describe('Task 262 — the A/B flag (Door 1)', () => {
  // The DEFAULT is the contract this block exists to pin, and it is OFF
  // (D-436, lead-ratified on the measured two-evidence basis: write-time
  // linking regresses the qtype it was built for, and costs +2.8 s per capture
  // on a 2,260-fact corpus). Flipping this default is a decision, and a
  // decision should break a test.
  it('C1 defaults OFF — the mechanism ships complete, but opt-in', () => {
    expect(linkingEnabled({ projectRoot })).toBe(false);
  });

  it('C2 settings memory.link_facts=true is the deliberate opt-in', () => {
    writeSettings({ memory: { link_facts: true } });
    expect(linkingEnabled({ projectRoot })).toBe(true);
  });

  it('C3 env CMK_LINK_FACTS wins over settings, in BOTH directions', () => {
    writeSettings({ memory: { link_facts: true } });
    process.env.CMK_LINK_FACTS = '0';
    expect(linkingEnabled({ projectRoot })).toBe(false);

    writeSettings({ memory: { link_facts: false } });
    process.env.CMK_LINK_FACTS = '1';
    expect(linkingEnabled({ projectRoot })).toBe(true);
  });
});

// --- D. The writeFact integration ------------------------------------------

describe('Task 262 — writeFact auto-links on the real write path (Doors 1, 2, 5)', () => {
  // These tests exercise the MECHANISM, which since D-436 is opt-in — so they
  // opt in explicitly. D0 below is the one that pins the DEFAULT behaviour of
  // the real write path, and it deliberately sets nothing.
  beforeEach(() => {
    process.env.CMK_LINK_FACTS = '1';
  });

  // The probe body every D-test writes. Deliberately NOT byte-identical to any
  // seeded fact: an identical body is the SAME content-addressed id, which
  // writeFact correctly answers with `skipped: duplicate` before linking is ever
  // reached.
  const PROBE = 'The broker was swapped out once its throughput ceiling started biting staging deploys.';

  /**
   * Seed a corpus with real candidates AND pin the floor explicitly.
   *
   * The floor is PINNED rather than derived here on purpose: floor derivation
   * has its own boundary (A1-A5), and a test that depends on BOTH contracts at
   * once fails for two unrelated reasons and pins neither. What these tests own
   * is the write-path integration — does `writeFact` read the floor, respect the
   * cap, land `related:` frontmatter, and audit it.
   */
  function seedLinkableCorpus() {
    for (let i = 0; i < 30; i++) {
      seedFact({ slug: `noise-${i}`, title: `Noise ${i}`, body: vocabBody(i, i % 6) });
    }
    seedFact({
      slug: 'rabbitmq-retired',
      title: 'RabbitMQ retired',
      body: 'We retired the RabbitMQ broker after the throughput ceiling bit us in staging.',
    });
    seedFact({
      slug: 'broker-throughput-ceiling',
      title: 'Broker throughput ceiling',
      body: 'The broker throughput ceiling was measured at staging load and it bit us.',
    });
    seedFact({
      slug: 'staging-deploy-window',
      title: 'Staging deploy window',
      body: 'Staging deploys run in a window that the broker throughput ceiling used to break.',
    });
    seedFact({
      slug: 'broker-swap-plan',
      title: 'Broker swap plan',
      body: 'The plan was to swap the broker out before staging deploys hit the ceiling again.',
    });
    const db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });
    pinFloor(db);
    db.close();
  }

  it('D0 with NO configuration at all the write path links NOTHING (the shipped default)', () => {
    delete process.env.CMK_LINK_FACTS; // the beforeEach above opted in; undo it
    seedLinkableCorpus();
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'default-off',
      title: 'Default off', body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    expect(r.action).toBe('created');
    expect(readFileSync(r.path, 'utf8')).not.toMatch(/^related:/m);
    expect(auditLines().filter((e) => e.action === 'auto-linked').length).toBe(0);
  });

  it('D1 a new fact lands with `related:` slugs + an auto-linked audit entry', () => {
    seedLinkableCorpus();
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'broker-replacement',
      title: 'Broker replacement',
      body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    expect(r.action).toBe('created');
    const text = readFileSync(r.path, 'utf8');
    expect(text).toMatch(/^related:/m);

    const linked = auditLines().filter((e) => e.action === 'auto-linked');
    expect(linked.length).toBe(1);
    const entry = linked[0];
    expect(entry.id).toBe(r.id);
    expect(entry.extra.backend).toBe('jaccard');
    expect(typeof entry.extra.floor).toBe('number');
    expect(Array.isArray(entry.extra.links)).toBe(true);
    expect(entry.extra.links.length).toBeGreaterThan(0);
    expect(entry.extra.links.length).toBeLessThanOrEqual(LINK_CAP);
    for (const l of entry.extra.links) {
      expect(l.id).toMatch(/^P-/);
      expect(typeof l.slug).toBe('string');
      expect(typeof l.score).toBe('number');
      expect(l.band).toBe('related');
    }
  });

  it('D2 the auto-written links become traversable edges (the whole point)', () => {
    seedLinkableCorpus();
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'broker-replacement-2',
      title: 'Broker replacement 2',
      body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      const rows = traverseLinks(db, r.id, { depth: 1, direction: 'out' });
      const related = rows.filter((e) => e.type === 'related' && e.dst_resolved === 1);
      expect(related.length).toBeGreaterThan(0);
    } finally {
      db.close();
    }
  });

  it('D3 the flag OFF writes an UNLINKED fact and no audit entry', () => {
    seedLinkableCorpus();
    process.env.CMK_LINK_FACTS = '0';
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'flag-off',
      title: 'Flag off',
      body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    expect(r.action).toBe('created');
    expect(readFileSync(r.path, 'utf8')).not.toMatch(/^related:/m);
    expect(auditLines().filter((e) => e.action === 'auto-linked').length).toBe(0);
  });

  it('D4 a caller-supplied `related` is never overwritten by the linker', () => {
    seedLinkableCorpus();
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'explicit-links',
      title: 'Explicit links',
      body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      related: ['noise-0'],
      projectRoot, userDir,
    });
    const text = readFileSync(r.path, 'utf8');
    expect(text).toMatch(/^related:\s*\[?\s*noise-0/m);
    expect(auditLines().filter((e) => e.action === 'auto-linked').length).toBe(0);
  });

  it('D5 NO floor in the index → the fact is written UNLINKED, never blocked', () => {
    // Fresh install: nothing indexed, so no floor is derivable.
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'no-floor',
      title: 'No floor', body: 'A first fact on a brand-new install.',
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    expect(r.action).toBe('created');
    expect(readFileSync(r.path, 'utf8')).not.toMatch(/^related:/m);
  });

  it('D6 a linker that THROWS never turns a successful capture into an error', () => {
    seedLinkableCorpus();
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'linker-throws',
      title: 'Linker throws', body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      _linkFn: () => { throw new Error('boom'); },
      projectRoot, userDir,
    });
    expect(r.action).toBe('created');
    expect(existsSync(r.path)).toBe(true);
  });

  it('D7 OVER-MUTATION GUARD — linking one fact leaves every other fact file byte-identical', () => {
    seedLinkableCorpus();
    const before = snapshotFactFiles();
    const r = writeFact({
      tier: 'P', type: 'project', slug: 'over-mutation',
      title: 'Over mutation',
      body: PROBE,
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    const after = snapshotFactFiles();
    // Exactly one new file; every pre-existing file untouched.
    expect(after.size).toBe(before.size + 1);
    for (const [name, content] of before) {
      expect(after.get(name), `${name} was mutated by a link write`).toBe(content);
    }
    expect(after.has(`project_over-mutation.md`)).toBe(true);
    expect(r.action).toBe('created');
  });
});

// --- E. Band 3 — the conflict queue ----------------------------------------

describe('Task 262 — the near-dup band routes to the conflict queue (Doors 2, 5)', () => {
  // Opt in: the near-dup routing is part of the write-time mechanism (D-436).
  beforeEach(() => {
    process.env.CMK_LINK_FACTS = '1';
  });

  it('E1 a near-dup candidate queues a proposal AND the fact is still captured', () => {
    for (let i = 0; i < 30; i++) {
      seedFact({ slug: `qnoise-${i}`, title: `QNoise ${i}`, body: vocabBody(i, 0) });
    }
    const twin = seedFact({
      slug: 'uv-not-pip',
      title: 'uv not pip',
      body: 'Always install python packages with uv, never with pip.',
    });
    const db = openIndexDb({ projectRoot });
    reindexFull({ projectRoot, userDir, db });
    pinFloor(db);
    db.close();

    const r = writeFact({
      tier: 'P', type: 'project', slug: 'uv-over-pip',
      title: 'uv over pip',
      body: 'Always install python packages with uv, never with pip today.',
      writeSource: 'user-explicit', trust: 'high',
      sourceFile: 'test', sourceLine: 1, sourceSha1: 'x',
      projectRoot, userDir,
    });
    // Capture ALWAYS wins — the near-dup is a proposal, not a block.
    expect(r.action).toBe('created');
    expect(existsSync(r.path)).toBe(true);

    const queuePath = join(projectRoot, 'context', 'queues', 'conflicts.md');
    expect(existsSync(queuePath)).toBe(true);
    const q = readFileSync(queuePath, 'utf8');
    expect(q).toContain(r.id);
    expect(q).toContain(twin.id);
    expect(q).toMatch(/similarity_backend: jaccard/);
    expect(q).toMatch(/resolution: pending/);
  });

  it('E2 backfill mode never queues (both facts already exist and were accepted)', () => {
    for (let i = 0; i < 30; i++) {
      seedFact({ slug: `bnoise-${i}`, title: `BNoise ${i}`, body: vocabBody(i, 0) });
    }
    seedFact({
      slug: 'uv-not-pip-b',
      title: 'uv not pip b',
      body: 'Always install python packages with uv, never with pip.',
    });
    const target = seedFact({
      slug: 'uv-over-pip-b',
      title: 'uv over pip b',
      body: 'Always install python packages with uv, never with pip today.',
    });
    const db = openIndexDb({ projectRoot });
    try {
      reindexFull({ projectRoot, userDir, db });
      pinFloor(db);
      const decision = autoLinkFact({
        db, projectRoot, userDir, tier: 'P',
        id: target.id, text: 'Always install python packages with uv, never with pip today.',
        mode: 'backfill',
      });
      expect(decision.queued).toBe(0);
    } finally {
      db.close();
    }
    expect(existsSync(join(projectRoot, 'context', 'queues', 'conflicts.md'))).toBe(false);
  });
});

// --- F. The symmetric semantic backend (the bug the AFTER measurement found) --

describe('Task 262 — the backfill semantic backend scores BOTH sides (Door 1)', () => {
  // Two orthogonal unit vectors + one that leans toward the first. Enough to
  // prove the scorer reads both arguments; the real embedder is the live-test.
  const VEC = {
    alpha: [1, 0, 0],
    beta: [0, 1, 0],
    nearAlpha: [0.8, 0.6, 0],
  };
  const TEXT = {
    alpha: 'the alpha document body',
    beta: 'the beta document body',
    nearAlpha: 'the near-alpha document body',
  };

  function seedCache(db, modelId = 'test-model') {
    db.exec(`CREATE TABLE IF NOT EXISTS embedding_cache (
      content_sha TEXT PRIMARY KEY, model TEXT NOT NULL, vector BLOB NOT NULL);`);
    const ins = db.prepare('INSERT OR REPLACE INTO embedding_cache (content_sha, model, vector) VALUES (?, ?, ?)');
    for (const [k, text] of Object.entries(TEXT)) {
      ins.run(embeddingCacheKey(modelId, text), modelId, Buffer.from(new Float32Array(VEC[k]).buffer));
    }
    return modelId;
  }

  it('F1 similarity depends on BOTH arguments and is symmetric', () => {
    const db = openIndexDb({ projectRoot });
    try {
      seedCache(db);
      const be = makeCachedCosineBackend(db, { modelId: 'test-model' });
      expect(be).not.toBeNull();
      expect(be.backend).toBe('semantic');

      const alphaBeta = be.similarityFn(TEXT.alpha, TEXT.beta);
      const alphaNear = be.similarityFn(TEXT.alpha, TEXT.nearAlpha);

      // THE REGRESSION THIS PINS: the capture-path scorer closes over ONE
      // embedded text and ignores its first argument, so a backfill driven by it
      // would return the same number here regardless of the pair. These must
      // differ, and they must be the real cosines.
      expect(alphaBeta).toBeCloseTo(0, 5);
      expect(alphaNear).toBeCloseTo(0.8, 5);
      expect(alphaNear).not.toBeCloseTo(alphaBeta, 3);

      // Symmetric — a link between two existing facts has no "new" side.
      expect(be.similarityFn(TEXT.beta, TEXT.alpha)).toBeCloseTo(alphaBeta, 6);
      expect(be.similarityFn(TEXT.nearAlpha, TEXT.alpha)).toBeCloseTo(alphaNear, 6);
    } finally {
      db.close();
    }
  });

  it('F2 an uncached pair degrades to token-Jaccard for that pair, never to zero', () => {
    const db = openIndexDb({ projectRoot });
    try {
      seedCache(db);
      const be = makeCachedCosineBackend(db, { modelId: 'test-model' });
      const uncached = 'a body that was never embedded at all';
      expect(be.similarityFn(TEXT.alpha, uncached)).toBe(
        tokenJaccardSimilarity(TEXT.alpha, uncached),
      );
    } finally {
      db.close();
    }
  });

  it('F3 returns null when nothing is cached (the embedder was never installed)', () => {
    const db = openIndexDb({ projectRoot });
    try {
      expect(makeCachedCosineBackend(db)).toBeNull();
    } finally {
      db.close();
    }
  });
});
