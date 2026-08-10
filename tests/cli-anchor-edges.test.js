// @doors: 1, 2
// Door 3 N/A: in-process only — better-sqlite3 + fs, no subprocess spawn.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: rebuildEdges emits no kit NDJSON log — it is a pure index rebuild
//   (the reindex summary line is the observability surface, covered by
//   cli-index-rebuild's subcommand tests).
//
// Task 256 (ADR-0023 ACTIVATE slice / D-400) — anchor co-citation edges. Fact
// BODIES densely cite structured anchors (`D-nnn`, `Task nnn`, `ADR-nnnn`,
// `FR-nn`/`NFR-nn`, and `[PUL]-XXXXXXXX` fact ids) — this extracts that lattice
// into `cites` edges (fact → anchor), a CAPPED STAR (linear cost, never
// all-pairs), with two noise guards (single-citer floor + document-frequency
// ceiling). Tests: extraction shapes + boundary cases, the linear cap, the
// guards at/over their thresholds, byte-stable rebuild, over-mutation, and the
// `cmk links D-nnn` query answering "what cites this anchor".

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { install } from '../packages/cli/src/install.mjs';
import { openIndexDb, getIndexDbPath } from '../packages/cli/src/index-db.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import {
  extractAnchors,
  anchorNodeForToken,
  computeCitations,
  rebuildEdges,
  edgesBuilt,
  MIN_ANCHOR_CITERS,
  ANCHOR_DF_CEILING_RATIO,
} from '../packages/cli/src/graph-index.mjs';
import { buildLinks, getObservations } from '../packages/cli/src/read-core.mjs';

let sandbox, projectRoot, userDir, db;

// Deterministic valid fact ids (kit base32 alphabet — excludes 0/O/1/l/I/8).
// Generated so the 50+-fact linear-cost corpus needs no hand-listed ids; each
// is a real ID_PATTERN match writeFact accepts. (Programmatic, so the literal
// tokens never trip validate-test-ids.)
//
// Task 270: this was a hand-copied literal `'23456789ABCDEFGHJKLMNPQRSTUVWXYZa'`
// — 33 chars, INCLUDING the `8` the comment above correctly says is excluded.
// 21 of the 110 generated ids therefore failed ID_PATTERN, and the fixture only
// worked because `writeFact` accepted a supplied id without checking it (D-427,
// the very bug this task closes). `validate-test-ids` could not catch it: the
// ids are COMPUTED at runtime, not literal tokens in the source — the same
// "enforced one layer too late" shape as the bug itself. Now imported from the
// canonical source so the fixture cannot drift from the kit's real alphabet.
import { BASE32_ALPHABET as ALPHABET } from '../packages/canonicalize/src/index.mjs';
function mkId(n) {
  let x = n;
  let s = '';
  for (let i = 0; i < 8; i++) {
    s = ALPHABET[x % 32] + s;
    x = Math.floor(x / 32);
  }
  return `P-${s}`;
}

function seedFact({ id, slug, body }) {
  const r = writeFact({
    projectRoot,
    tier: 'P',
    type: 'feedback',
    slug,
    title: slug,
    body: body ?? `fact ${slug}`,
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'MEMORY.md',
    sourceLine: 1,
    sourceSha1: 'a'.repeat(40),
    id,
  });
  if (r.action === 'error') throw new Error(`seedFact failed: ${(r.errors ?? []).join('; ')}`);
  return r.path;
}

function dumpCites() {
  return db
    .prepare("SELECT src, dst, type, dst_resolved FROM edges WHERE type = 'cites' ORDER BY src, dst")
    .all();
}

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-anchor-edges-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
  db = openIndexDb({ projectRoot });
});
afterEach(() => {
  db?.close();
  rmSync(sandbox, { recursive: true, force: true });
});

// --------------------------------------------------------------------------
describe('extractAnchors — pure body → anchor tokens', () => {
  it('extracts each anchor class in canonical form', () => {
    expect(extractAnchors('per D-361 and Task 232, see ADR-0023 (FR-13, NFR-9)')).toEqual([
      'anchor:D-361',
      'anchor:Task-232',
      'anchor:ADR-0023',
      'anchor:FR-13',
      'anchor:NFR-9',
    ]);
  });

  it('extracts a cited fact id verbatim (no anchor: prefix — it is a real node)', () => {
    expect(extractAnchors('this supersedes P-4VAY63ST per the merge')).toEqual(['P-4VAY63ST']);
  });

  it('dedups distinct tokens in first-seen order', () => {
    expect(extractAnchors('D-1 then D-1 again then Task 5 then D-1')).toEqual([
      'anchor:D-1',
      'anchor:Task-5',
    ]);
  });

  it('NFR-9 is NFR, never also FR (word-boundary keeps them distinct)', () => {
    expect(extractAnchors('NFR-9 only')).toEqual(['anchor:NFR-9']);
    expect(extractAnchors('FR-9 only')).toEqual(['anchor:FR-9']);
  });

  // Boundary cases the task entry names explicitly.
  it('D-361x does NOT match (trailing word char fails the boundary)', () => {
    expect(extractAnchors('the flag D-361x is not a decision')).toEqual([]);
  });

  it("Task 232's (possessive) still extracts Task 232 (apostrophe is a boundary)", () => {
    expect(extractAnchors("per Task 232's cap")).toEqual(['anchor:Task-232']);
  });

  // Code-fence / inline-code exclusion — a literal example must never mint an edge.
  it('ignores anchors inside a fenced code block', () => {
    expect(extractAnchors('```\nsee D-361 and Task 5\n```')).toEqual([]);
  });

  it('ignores anchors inside an inline code span', () => {
    expect(extractAnchors('the token `D-361` is a literal')).toEqual([]);
  });

  it('still extracts anchors OUTSIDE code', () => {
    expect(extractAnchors('`D-1 literal` but D-2 is real')).toEqual(['anchor:D-2']);
  });
});

// --------------------------------------------------------------------------
describe('extractAnchors — plural / range / slash shorthand (review finding 1)', () => {
  it('plural `Tasks` + a range emits ENDPOINTS ONLY (not the interior)', () => {
    expect(extractAnchors('see Tasks 28-35 for context')).toEqual(['anchor:Task-28', 'anchor:Task-35']);
    expect(extractAnchors('Task 28-35 range')).toEqual(['anchor:Task-28', 'anchor:Task-35']);
    expect(extractAnchors('just Tasks 28 alone')).toEqual(['anchor:Task-28']);
    expect(extractAnchors('single Task 232 here')).toEqual(['anchor:Task-232']);
  });

  it('slash-continuation: bare trailing numbers inherit the prefix', () => {
    expect(extractAnchors('FR-28/29/30 all apply')).toEqual(['anchor:FR-28', 'anchor:FR-29', 'anchor:FR-30']);
    expect(extractAnchors('NFR-1/2 both')).toEqual(['anchor:NFR-1', 'anchor:NFR-2']);
    expect(extractAnchors('D-40/153 shorthand')).toEqual(['anchor:D-40', 'anchor:D-153']);
  });

  it('each-part-carries-its-own-prefix slash form yields both (via re-scan)', () => {
    expect(extractAnchors('D-40/D-153 style')).toEqual(['anchor:D-40', 'anchor:D-153']);
  });

  it('still rejects the negatives (a version, a glued suffix)', () => {
    expect(extractAnchors('shipped in v0.6.3 today')).toEqual([]);
    expect(extractAnchors('the flag D-361x is not a decision')).toEqual([]);
  });
});

// --------------------------------------------------------------------------
describe('small-corpus ceiling floor (review finding 2) — N=2/3/4 boundary', () => {
  const mk = (n, body) => ({ id: mkId(n), filename: `feedback_${n}.md`, body });

  it('N=2 (at-cap): ceiling floored to MIN_ANCHOR_CITERS — both citers form an edge', () => {
    const { qualifying, ceiling } = computeCitations([mk(700, 'D-5'), mk(701, 'D-5')]);
    expect(ceiling).toBe(2); // Math.max(2, floor(2*0.5)=1)
    expect(qualifying.has('anchor:D-5')).toBe(true);
  });

  it('N=3: an anchor cited by 2 of 3 qualifies (was impossible before the floor)', () => {
    const { qualifying, ceiling } = computeCitations([mk(702, 'D-5'), mk(703, 'D-5'), mk(704, 'plain')]);
    expect(ceiling).toBe(2); // Math.max(2, floor(3*0.5)=1)
    expect(qualifying.has('anchor:D-5')).toBe(true);
  });

  it('N=3 (over-cap): an anchor cited by ALL 3 is dropped as a stopword', () => {
    const { qualifying } = computeCitations([mk(705, 'D-5'), mk(706, 'D-5'), mk(707, 'D-5')]);
    expect(qualifying.has('anchor:D-5')).toBe(false); // df=3 > ceiling 2
  });

  it('N=4: behavior identical to before — floor(4*0.5)=2 == MIN, df=2 qualifies', () => {
    const { qualifying, ceiling } = computeCitations([mk(708, 'D-5'), mk(709, 'D-5'), mk(710, 'p'), mk(711, 'p')]);
    expect(ceiling).toBe(2);
    expect(qualifying.has('anchor:D-5')).toBe(true);
  });
});

// --------------------------------------------------------------------------
describe('links --direction out surfaces a fact\'s cites edges (review finding 3, ratified intended)', () => {
  it("a fact's out-links include its anchor: cites nodes; get.related stays clean", () => {
    seedFact({ id: mkId(720), slug: 'a', body: 'per D-361 shipped' });
    seedFact({ id: mkId(721), slug: 'b', body: 'D-361 too' });
    for (let i = 722; i < 728; i++) seedFact({ id: mkId(i), slug: `p${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    // links (the graph surface) SHOWS the cites out-edge to the anchor node.
    const out = buildLinks(db, mkId(720), { direction: 'out' }).out;
    expect(out.some((e) => e.to === 'anchor:D-361' && e.type === 'cites')).toBe(true);
    // get.related (the fact surface) does NOT — the deliberate asymmetry.
    const [row] = getObservations(db, [mkId(720)]);
    expect(row.related ?? []).not.toContain('anchor:D-361');
  });
});

// --------------------------------------------------------------------------
describe('anchorNodeForToken — query-input normalizer', () => {
  it('maps each anchor token to its canonical node', () => {
    expect(anchorNodeForToken('D-361')).toBe('anchor:D-361');
    expect(anchorNodeForToken('Task 232')).toBe('anchor:Task-232');
    expect(anchorNodeForToken('Task-232')).toBe('anchor:Task-232');
    expect(anchorNodeForToken('ADR-0023')).toBe('anchor:ADR-0023');
    expect(anchorNodeForToken('FR-13')).toBe('anchor:FR-13');
    expect(anchorNodeForToken('NFR-9')).toBe('anchor:NFR-9');
  });

  it('passes a valid fact id through unchanged', () => {
    expect(anchorNodeForToken('P-2DZG7XF4')).toBe('P-2DZG7XF4');
  });

  it('returns null for a token that is neither a fact id nor an anchor', () => {
    expect(anchorNodeForToken('not-an-id')).toBeNull();
    expect(anchorNodeForToken('D-361x')).toBeNull();
    expect(anchorNodeForToken('')).toBeNull();
  });
});

// --------------------------------------------------------------------------
describe('cites edges — capped star, guards applied', () => {
  it('emits fact→anchor cites edges for a co-cited anchor (dst_resolved 0)', () => {
    seedFact({ id: mkId(1), slug: 'a', body: 'per D-361 we decided' });
    seedFact({ id: mkId(2), slug: 'b', body: 'D-361 again here' });
    seedFact({ id: mkId(3), slug: 'c', body: 'no anchors' });
    seedFact({ id: mkId(4), slug: 'd', body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    const rows = db
      .prepare("SELECT src, dst, dst_resolved FROM edges WHERE dst = 'anchor:D-361' AND type = 'cites' ORDER BY src")
      .all();
    expect(rows.map((r) => r.src).sort()).toEqual([mkId(1), mkId(2)].sort());
    expect(rows.every((r) => r.dst_resolved === 0)).toBe(true);
  });

  it('a cited FACT id resolves (dst_resolved 1 when the fact exists, 0 when dangling)', () => {
    const target = mkId(10);
    seedFact({ id: target, slug: 'target', body: 'the target fact' });
    seedFact({ id: mkId(11), slug: 'citer', body: `builds on ${target} directly` });
    seedFact({ id: mkId(12), slug: 'dangler', body: 'refs P-ZZZZZZZZ which does not exist' });
    reindexFull({ projectRoot, userDir, db });
    const resolved = db.prepare("SELECT * FROM edges WHERE src = ? AND type = 'cites'").get(mkId(11));
    expect(resolved).toMatchObject({ src: mkId(11), dst: target, type: 'cites', dst_resolved: 1 });
    const dangling = db.prepare("SELECT * FROM edges WHERE src = ? AND type = 'cites'").get(mkId(12));
    expect(dangling).toMatchObject({ dst: 'P-ZZZZZZZZ', dst_resolved: 0 });
  });

  // --- Single-citer guard (MIN_ANCHOR_CITERS): budget pair, at/over -------
  it('MIN_ANCHOR_CITERS floor: a doc-anchor cited by only 1 fact is SKIPPED (over-cap = below floor)', () => {
    expect(MIN_ANCHOR_CITERS).toBe(2);
    // D-777 cited by exactly ONE fact → no co-citation cluster → no edge.
    seedFact({ id: mkId(20), slug: 'lonely', body: 'only I cite D-777' });
    for (let i = 21; i < 26; i++) seedFact({ id: mkId(i), slug: `pad${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    expect(db.prepare("SELECT COUNT(*) AS n FROM edges WHERE dst = 'anchor:D-777'").get().n).toBe(0);
  });

  it('MIN_ANCHOR_CITERS floor: a doc-anchor cited by exactly 2 facts is KEPT (at-cap)', () => {
    seedFact({ id: mkId(30), slug: 'x', body: 'D-888 here' });
    seedFact({ id: mkId(31), slug: 'y', body: 'D-888 too' });
    for (let i = 32; i < 38; i++) seedFact({ id: mkId(i), slug: `pad${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    expect(db.prepare("SELECT COUNT(*) AS n FROM edges WHERE dst = 'anchor:D-888'").get().n).toBe(2);
  });

  it('a cited FACT id at df=1 is EXEMPT from the floor (a direct fact→fact edge is signal)', () => {
    const target = mkId(40);
    seedFact({ id: target, slug: 'tgt', body: 'target' });
    seedFact({ id: mkId(41), slug: 'one', body: `only reference to ${target}` });
    for (let i = 42; i < 48; i++) seedFact({ id: mkId(i), slug: `pad${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    expect(db.prepare('SELECT COUNT(*) AS n FROM edges WHERE dst = ? AND type = \'cites\'').get(target).n).toBe(1);
  });

  // --- Document-frequency ceiling (ANCHOR_DF_CEILING_RATIO): at/over ------
  it('ANCHOR_DF_CEILING_RATIO: a doc-anchor cited by more than half the corpus is dropped as a stopword (over-cap)', () => {
    expect(ANCHOR_DF_CEILING_RATIO).toBe(0.5);
    // 10-fact corpus → ceiling = floor(10 * 0.5) = 5. Cite D-999 from 6 facts → df 6 > 5 → dropped.
    for (let i = 50; i < 56; i++) seedFact({ id: mkId(i), slug: `s${i}`, body: 'stopword D-999 everywhere' });
    for (let i = 56; i < 60; i++) seedFact({ id: mkId(i), slug: `s${i}`, body: 'plain fact' });
    reindexFull({ projectRoot, userDir, db });
    expect(db.prepare("SELECT COUNT(*) AS n FROM edges WHERE dst = 'anchor:D-999'").get().n).toBe(0);
  });

  it('ANCHOR_DF_CEILING_RATIO: a doc-anchor cited by exactly half the corpus is KEPT (at-cap)', () => {
    // 10-fact corpus → ceiling = 5. Cite D-555 from exactly 5 facts → df 5 = ceiling → kept.
    for (let i = 60; i < 65; i++) seedFact({ id: mkId(i), slug: `h${i}`, body: 'D-555 cited here' });
    for (let i = 65; i < 70; i++) seedFact({ id: mkId(i), slug: `h${i}`, body: 'plain fact' });
    reindexFull({ projectRoot, userDir, db });
    expect(db.prepare("SELECT COUNT(*) AS n FROM edges WHERE dst = 'anchor:D-555'").get().n).toBe(5);
  });
});

// --------------------------------------------------------------------------
describe('linear cost — a 50-fact anchor group is a capped star, never all-pairs', () => {
  it('50 facts citing one anchor → 50 cites edges (linear), not 1225 (C(50,2))', () => {
    // 50 citers + 60 padding = 110 corpus → ceiling floor(110*0.5)=55; df 50 ≤ 55, ≥ 2 → kept.
    for (let i = 100; i < 150; i++) seedFact({ id: mkId(i), slug: `g${i}`, body: 'cites D-500 as a hub' });
    for (let i = 150; i < 210; i++) seedFact({ id: mkId(i), slug: `p${i}`, body: 'padding, no anchor' });
    reindexFull({ projectRoot, userDir, db });
    const n = db.prepare("SELECT COUNT(*) AS n FROM edges WHERE dst = 'anchor:D-500' AND type = 'cites'").get().n;
    expect(n).toBe(50); // linear, not 1225
    // And no cites edge count for any single anchor exceeds the corpus size.
    const max = db
      .prepare("SELECT dst, COUNT(*) AS n FROM edges WHERE type = 'cites' GROUP BY dst ORDER BY n DESC LIMIT 1")
      .get();
    expect(max.n).toBeLessThanOrEqual(210);
  });
});

// --------------------------------------------------------------------------
describe('computeCitations — the shared guard/aggregation boundary', () => {
  it('reports qualifying anchors and their distinct citers under the default thresholds', () => {
    // 10-fact corpus → ceiling floor(10*0.5)=5. D-1 df=3 (≥2, ≤5) qualifies;
    // D-2 df=2 qualifies; D-9 df=1 (below floor) does NOT.
    const facts = [
      { id: mkId(300), filename: 'feedback_a.md', body: 'D-1 and D-2' },
      { id: mkId(301), filename: 'feedback_b.md', body: 'D-1 here too' },
      { id: mkId(302), filename: 'feedback_c.md', body: 'D-2 and D-1 again' },
      { id: mkId(303), filename: 'feedback_d.md', body: 'D-9 alone' },
      { id: mkId(304), filename: 'feedback_e.md', body: 'plain' },
      { id: mkId(305), filename: 'feedback_f.md', body: 'plain' },
      { id: mkId(306), filename: 'feedback_g.md', body: 'plain' },
      { id: mkId(307), filename: 'feedback_h.md', body: 'plain' },
      { id: mkId(308), filename: 'feedback_i.md', body: 'plain' },
      { id: mkId(309), filename: 'feedback_j.md', body: 'plain' },
    ];
    const { qualifying, anchorCiters, ceiling } = computeCitations(facts);
    expect(ceiling).toBe(5);
    expect(anchorCiters.get('anchor:D-1').size).toBe(3);
    expect(qualifying.has('anchor:D-1')).toBe(true);
    expect(qualifying.has('anchor:D-2')).toBe(true);
    expect(qualifying.has('anchor:D-9')).toBe(false); // df=1 below the floor
  });
});

// --------------------------------------------------------------------------
describe('byte-stable rebuild (ADR-0002 determinism)', () => {
  it('two full reindexes over the same corpus produce identical cites rows', () => {
    seedFact({ id: mkId(400), slug: 'a', body: 'D-361 and Task 5' });
    seedFact({ id: mkId(401), slug: 'b', body: 'D-361 again, Task 5 again' });
    for (let i = 402; i < 408; i++) seedFact({ id: mkId(i), slug: `p${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    const first = dumpCites();
    reindexFull({ projectRoot, userDir, db });
    const second = dumpCites();
    expect(second).toEqual(first);
    expect(first.length).toBeGreaterThan(0);
  });

  it('a direct rebuildEdges call is idempotent (delete+insert, no growth)', () => {
    seedFact({ id: mkId(410), slug: 'a', body: 'D-42 hub' });
    seedFact({ id: mkId(411), slug: 'b', body: 'D-42 hub too' });
    for (let i = 412; i < 418; i++) seedFact({ id: mkId(i), slug: `p${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    const before = dumpCites();
    rebuildEdges(db, { projectRoot, userDir });
    expect(dumpCites()).toEqual(before);
  });
});

// --------------------------------------------------------------------------
describe('over-mutation guard — changing one fact leaves unrelated cites edges intact', () => {
  it('editing one fact\'s anchors does not disturb another anchor cluster', () => {
    // Two independent anchor clusters: D-100 (facts 500,501) and D-200 (facts 502,503).
    const p500 = seedFact({ id: mkId(500), slug: 'a', body: 'D-100 here' });
    seedFact({ id: mkId(501), slug: 'b', body: 'D-100 too' });
    seedFact({ id: mkId(502), slug: 'c', body: 'D-200 here' });
    seedFact({ id: mkId(503), slug: 'd', body: 'D-200 too' });
    for (let i = 504; i < 510; i++) seedFact({ id: mkId(i), slug: `p${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
    const d200Before = db
      .prepare("SELECT src, dst FROM edges WHERE dst = 'anchor:D-200' ORDER BY src")
      .all();

    // Mutate fact 500 ON DISK: drop D-100, add D-300 (which fact 501 does NOT
    // cite → df 1 → skipped). A single-fact mutation via the source markdown.
    writeFileSync(p500, readFileSync(p500, 'utf8').replace('D-100 here', 'now cites D-300 instead'), 'utf8');
    reindexFull({ projectRoot, userDir, db });

    const d200After = db
      .prepare("SELECT src, dst FROM edges WHERE dst = 'anchor:D-200' ORDER BY src")
      .all();
    expect(d200After).toEqual(d200Before); // the OTHER cluster is untouched
    // D-100 now cited by only fact 501 → drops below the floor → gone.
    expect(db.prepare("SELECT COUNT(*) AS n FROM edges WHERE dst = 'anchor:D-100'").get().n).toBe(0);
  });
});

// --------------------------------------------------------------------------
describe('edges CHECK migration — a pre-256 index accepts cites after openIndexDb', () => {
  it('drops a stale edges table (CHECK without cites), recreates it, clears the sentinel', () => {
    db.close(); // release the beforeEach handle
    const dbPath = getIndexDbPath(projectRoot);

    // Simulate a pre-256 index: an edges table whose CHECK lacks 'cites', with a
    // built sentinel and a legacy row.
    const raw = new Database(dbPath);
    raw.exec('DROP TABLE IF EXISTS edges');
    raw.exec(`CREATE TABLE edges (
      src TEXT NOT NULL, dst TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('related', 'link', 'superseded_by')),
      dst_resolved INTEGER NOT NULL DEFAULT 1, PRIMARY KEY (src, dst, type));`);
    raw.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT)");
    raw.prepare("INSERT INTO edges VALUES ('P-2DZG7XF4', 'P-34GZDKAW', 'related', 1)").run();
    raw.prepare("INSERT OR REPLACE INTO meta VALUES ('edges_built_at', '123')").run();
    // The old CHECK rejects a cites insert — proving the migration is needed.
    expect(() =>
      raw.prepare("INSERT INTO edges VALUES ('P-2DZG7XF4', 'anchor:D-1', 'cites', 0)").run(),
    ).toThrow();
    raw.close();

    // Reopen through the kit — migrateEdgesSchema runs before the schema.
    const migrated = openIndexDb({ projectRoot });
    // The stale table + row are gone; the sentinel is cleared (cold-edge path re-runs).
    expect(migrated.prepare('SELECT COUNT(*) AS n FROM edges').get().n).toBe(0);
    expect(edgesBuilt(migrated)).toBe(false);
    // A cites insert now SUCCEEDS under the new CHECK.
    expect(() =>
      migrated.prepare("INSERT INTO edges VALUES ('P-2DZG7XF4', 'anchor:D-1', 'cites', 0)").run(),
    ).not.toThrow();
    migrated.close();
    db = openIndexDb({ projectRoot }); // restore for afterEach close
  });
});

// --------------------------------------------------------------------------
describe('cmk links on an anchor — "what cites D-nnn" in one call', () => {
  beforeEach(() => {
    seedFact({ id: mkId(600), slug: 'a', body: 'per D-361 we shipped' });
    seedFact({ id: mkId(601), slug: 'b', body: 'D-361 is load-bearing' });
    for (let i = 602; i < 608; i++) seedFact({ id: mkId(i), slug: `p${i}`, body: 'padding' });
    reindexFull({ projectRoot, userDir, db });
  });

  it('buildLinks("D-361") returns the citing facts as backlinks, found:true', () => {
    const links = buildLinks(db, 'D-361', { direction: 'both' });
    expect(links.ok).toBe(true);
    expect(links.found).toBe(true);
    expect(links.id).toBe('anchor:D-361');
    expect(links.backlinks.map((e) => e.from).sort()).toEqual([mkId(600), mkId(601)].sort());
    expect(links.out).toEqual([]); // an anchor is a sink — nothing points OUT of it
    expect(links.supersession_chain).toBeNull();
  });

  it('direction:in on an anchor still surfaces the citers', () => {
    const links = buildLinks(db, 'D-361', { direction: 'in' });
    expect(links.backlinks.map((e) => e.from).sort()).toEqual([mkId(600), mkId(601)].sort());
    expect(links).not.toHaveProperty('out');
  });

  it('an anchor nobody cites (or below floor) → found:false', () => {
    const links = buildLinks(db, 'D-99999', { direction: 'both' });
    expect(links.ok).toBe(true);
    expect(links.found).toBe(false);
  });

  it('a genuinely bad token → schema error shape (not a crash)', () => {
    expect(buildLinks(db, 'not-an-anchor-or-id')).toEqual({
      ok: false,
      error: 'id must be a valid kit ID or anchor token (D-nnn, Task nnn, ADR-nnnn, FR-nn, NFR-nn)',
    });
  });
});
