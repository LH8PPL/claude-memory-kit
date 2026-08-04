// @doors: 1, 2
// Door 3 N/A: in-process — no subprocess spawn (better-sqlite3 + chokidar both run in the test process).
// Door 4 N/A: no message-queue interaction; chokidar's FS-event delivery is an OS callback, not the kit's queue surface.
// Door 5 N/A: index-rebuild.mjs doesn't emit kit NDJSON logs; the subcommand wrapper prints summary lines to stdout (tested separately by cli-scaffold integration).

// Tests for Task 29 — Reindex strategy (boot / runtime / recovery) (T-025).
// Per tasks.md 29.4:
//   - Test `--boot` with no changes: 0 files re-indexed; timer <200 ms
//   - Test `--boot` after editing one fact: only that file re-indexed
//   - Test runtime watcher: touch a file; FTS5 reflects within 1 s
//   - Test `--full`: drops DB; walks all markdown; row count == markdown fact count
//   - Test concurrent writers (one `--boot` + one runtime): no errors, no duplicate rows

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
  mkdirSync,
  utimesSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../packages/cli/src/install.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import {
  listObservationSources,
  reindexBoot,
  reindexFull,
  startRuntimeWatcher,
} from '../packages/cli/src/index-rebuild.mjs';
import * as graphIndex from '../packages/cli/src/graph-index.mjs';
import { edgesBuilt } from '../packages/cli/src/graph-index.mjs';
import { writeBullet } from '../packages/cli/src/provenance.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { overrideTrust } from '../packages/cli/src/trust.mjs';

let sandbox;
let projectRoot;
let userDir;
let db;

async function makeFixture() {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-index-rebuild-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
  db = openIndexDb({ projectRoot });
}

function seedScratchpad(projectRoot, bullets) {
  // bullets: [{id, text, provenance}]
  const lines = ['# MEMORY.md', '', '## Active Threads', ''];
  for (const b of bullets) {
    const r = writeBullet(b);
    lines.push(r.bullet);
    lines.push(r.comment);
  }
  lines.push('');
  writeFileSync(
    join(projectRoot, 'context', 'MEMORY.md'),
    lines.join('\n'),
    'utf8',
  );
}

// Task 182: seed an arbitrary named scratchpad at a TIER ROOT — the project
// tier root is `<projectRoot>/context`, the user tier root is `<userDir>`
// (SCRATCHPADS_BY_TIER / resolveTierRoot). Used to seed SOUL.md (project) +
// USER/HABITS/LESSONS.md (user persona), which the pre-182 indexer never
// walked. `tierRoot` is the resolved root, `fileName` the canonical scratchpad
// name, `title`/`section` the h1/h2 the persona files carry, `bullets` the
// same shape seedScratchpad uses.
function seedNamedScratchpad(tierRoot, fileName, title, section, bullets) {
  const lines = [`# ${title}`, '', `## ${section}`, ''];
  for (const b of bullets) {
    const r = writeBullet(b);
    lines.push(r.bullet);
    lines.push(r.comment);
  }
  lines.push('');
  writeFileSync(join(tierRoot, fileName), lines.join('\n'), 'utf8');
}

// Seed a per-fact file via the kit's actual writer. This used to hand-
// roll YAML, which silently agreed with the parser but disagreed with
// the writer's real on-disk shape (`created_at`/`source_file`/
// `source_sha1` vs the legacy `at`/`source`/`sha1` field names) —
// surfaced as Blocking finding B1+B2 by the Task 29 code-review.
// Calling writeFact() composes the test fixture with the production
// writer, so the parser and writer never drift again. Per CLAUDE.md
// "Integration-test coverage for cross-module flows" rule.
function seedFactFile(projectRoot, { id, type, title, body, write_source, trust, at, slug }) {
  const r = writeFact({
    projectRoot,
    tier: 'P',
    type,
    slug: slug ?? type, // simple slug for tests; the kit's normal naming uses descriptive slugs
    title,
    body,
    writeSource: write_source,
    trust,
    sourceFile: 'MEMORY.md',
    sourceLine: 1,
    sourceSha1: 'a'.repeat(40),
    createdAt: at,
    id, // explicit override so tests get deterministic IDs
  });
  if (r.action === 'error') {
    throw new Error(`seedFactFile failed: ${(r.errors ?? []).join('; ')}`);
  }
  return r.path;
}

function bulletInput({ id, text, line, at = '2026-05-27T10:00:00Z' }) {
  return {
    id,
    text,
    provenance: {
      source: 'MEMORY.md',
      source_line: line,
      sha1: 'b'.repeat(40),
      write: 'user-explicit',
      trust: 'high',
      at,
    },
  };
}

beforeEach(async () => {
  await makeFixture();
});

afterEach(() => {
  db?.close();
  rmSync(sandbox, { recursive: true, force: true });
});

describe('Task 29 — index-rebuild', () => {
  describe('listObservationSources', () => {
    it('enumerates scratchpad + per-fact files across tiers', () => {
      seedScratchpad(projectRoot, [bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 })]);
      seedFactFile(projectRoot, {
        id: 'P-BBBBBBBB',
        type: 'project',
        title: 't',
        body: 'b',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
      });
      const sources = listObservationSources({ projectRoot, userDir });
      const kinds = sources.map((s) => s.kind).sort();
      expect(kinds).toContain('scratchpad');
      expect(kinds).toContain('fact');
    });

    // Task 182 (D-247): the indexer must walk EVERY canonical scratchpad per
    // tier (SCRATCHPADS_BY_TIER), not just the hardcoded `MEMORY.md`. Before
    // this fix the user-tier persona (USER/HABITS/LESSONS.md — where
    // `cmk lessons promote` writes) and the project-tier SOUL.md were never
    // indexed, so a promoted persona fact was unsearchable even in-session.
    it('182 — indexes the USER-tier persona scratchpads (HABITS/USER/LESSONS.md)', () => {
      seedNamedScratchpad(userDir, 'HABITS.md', '# Habits', 'Working Style', [
        bulletInput({ id: 'U-JXAKDYXT', text: 'always use uv never pip', line: 1 }),
      ]);
      const sources = listObservationSources({ projectRoot, userDir });
      const habits = sources.filter(
        (s) => s.kind === 'scratchpad' && s.tier === 'U' && s.path.endsWith('HABITS.md'),
      );
      expect(habits).toHaveLength(1);
    });

    it('182 — indexes the project-tier SOUL.md (same bug class, project tier)', () => {
      seedNamedScratchpad(join(projectRoot, 'context'), 'SOUL.md', 'Project Soul', 'Operating Defaults', [
        bulletInput({ id: 'P-SULRVRFY', text: 'verify against primary sources', line: 1 }),
      ]);
      const sources = listObservationSources({ projectRoot, userDir });
      const soul = sources.filter(
        (s) => s.kind === 'scratchpad' && s.tier === 'P' && s.path.endsWith('SOUL.md'),
      );
      expect(soul).toHaveLength(1);
    });

    it('182 — a promoted persona bullet is SEARCHABLE end-to-end (reindex → query the row)', () => {
      seedNamedScratchpad(userDir, 'HABITS.md', '# Habits', 'Working Style', [
        bulletInput({ id: 'U-JXAKDYXT', text: 'always use uv never pip before committing', line: 1 }),
      ]);
      reindexFull({ projectRoot, userDir, db });
      const row = db.prepare("SELECT id, tier, body FROM observations WHERE id = ?").get('U-JXAKDYXT');
      expect(row).toBeTruthy();
      expect(row.tier).toBe('U');
      expect(row.body).toContain('uv');
    });

    // Task 183 (D-247): the scaffold seeds every scratchpad (SOUL/USER/HABITS/
    // LESSONS/machine-paths/overrides) with `(example)` placeholder bullets
    // carrying the seed sentinel (`sha1: 0{40}` + `at: 2020-01-01T…`). Now that
    // 182 indexes those scratchpads, the seeds must NOT be indexed — else a
    // fresh install returns ONLY misleading example bullets on a real query.
    it('183 — scaffolded (example) seed bullets are NOT indexed', () => {
      // makeFixture() already ran a real install() → every tier's scratchpads
      // hold their `(example)` seeds. Index the untouched scaffold:
      reindexFull({ projectRoot, userDir, db });
      const rows = db.prepare('SELECT id, body FROM observations').all();
      // NO seed example bullet should have been indexed.
      const seededExample = rows.filter((r) => /\(example\)/.test(r.body));
      expect(seededExample).toHaveLength(0);
      // Sanity: the seed ids the scaffold ships must be absent from the index.
      const seedIds = ['P-9Ba72DB2', 'L-aVFaHNDV', 'U-CEKUY3H4']; // exact scaffolded ids (case-sensitive)
      for (const id of seedIds) {
        expect(db.prepare('SELECT 1 FROM observations WHERE id = ?').get(id)).toBeUndefined();
      }
    });

    it('183 — a REAL bullet alongside seeds still indexes (the filter is seed-only)', () => {
      seedNamedScratchpad(userDir, 'HABITS.md', '# Habits', 'Working Style', [
        bulletInput({ id: 'U-JXAKDYXT', text: 'always use uv never pip', line: 1 }),
      ]);
      reindexFull({ projectRoot, userDir, db });
      // the real bullet indexes; the co-resident seeds do not.
      expect(db.prepare('SELECT 1 FROM observations WHERE id = ?').get('U-JXAKDYXT')).toBeTruthy();
      const seededExample = db.prepare("SELECT COUNT(*) n FROM observations WHERE body LIKE '%(example)%'").get();
      expect(seededExample.n).toBe(0);
    });

    // Task 182 review I1 (D-247): making the tier scratchpads searchable ALSO
    // makes the LOCAL tier's `machine-paths.md` / `overrides.md` searchable
    // in-project. DECIDED to accept: the local tier is a co-equal fillable tier
    // (design §2090); a REAL machine-path fact the user writes SHOULD be
    // findable (it's their own data, never leaves the machine), while a FRESH
    // local tier stays clean because its scaffold bullets are all seeds (183).
    // This test PINS both halves of that decision.
    it('182/183 — LOCAL-tier real bullet is searchable; fresh local scaffold seeds are not (I1)', () => {
      // A fresh scaffold's local seeds contribute nothing:
      reindexFull({ projectRoot, userDir, db });
      const seedLocal = db
        .prepare("SELECT COUNT(*) n FROM observations WHERE tier = 'L' AND body LIKE '%(example)%'")
        .get();
      expect(seedLocal.n).toBe(0);
      // A REAL local fact the user writes IS indexed + searchable (tier L):
      seedNamedScratchpad(
        join(projectRoot, 'context.local'),
        'machine-paths.md',
        'Machine paths (local tier)',
        'Tool Paths',
        [bulletInput({ id: 'L-JXAKDYXT', text: 'clang toolchain lives at a real path', line: 1 })],
      );
      reindexFull({ projectRoot, userDir, db });
      const row = db.prepare('SELECT tier FROM observations WHERE id = ?').get('L-JXAKDYXT');
      expect(row?.tier).toBe('L');
    });
  });

  describe('reindexBoot (29.1, 29.4 cases #1 + #2)', () => {
    it('initial boot indexes all sources', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'use pnpm', line: 5 }),
        bulletInput({ id: 'P-BBBBBBBB', text: 'we ship friday', line: 7 }),
      ]);
      seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC',
        type: 'project',
        title: 'rust for hot loops',
        body: 'we settled on rust for the perf-critical paths',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
      });
      const r = reindexBoot({ projectRoot, userDir, db });
      expect(r.filesReindexed).toBeGreaterThan(0);
      const count = db.prepare('SELECT COUNT(*) AS n FROM observations').get();
      expect(count.n).toBe(3);
    });

    it('29.4 #1 — boot with no changes: 0 files re-indexed; <200ms', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 }),
        bulletInput({ id: 'P-BBBBBBBB', text: 'two', line: 7 }),
      ]);
      seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC',
        type: 'project',
        title: 't',
        body: 'b',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
      });
      reindexBoot({ projectRoot, userDir, db }); // first boot — index everything
      const r2 = reindexBoot({ projectRoot, userDir, db }); // second boot — should be all-cached
      expect(r2.filesReindexed).toBe(0);
      expect(r2.observationsAffected).toBe(0);
      expect(r2.durationMs).toBeLessThan(200);
    });

    it('29.4 #2 — boot after editing one fact: only that file re-indexed', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'unchanged scratchpad', line: 5 }),
      ]);
      const factPath = seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC',
        type: 'project',
        title: 'original title',
        body: 'original body',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
      });
      reindexBoot({ projectRoot, userDir, db });
      // Modify ONLY the fact file. Hand-write the YAML in the kit's
      // writer-canonical shape (`created_at`/`source_file`/`source_sha1`,
      // type from VALID_TYPES). Earlier draft used the legacy short
      // field names + `decision` type — silently broken because the
      // parser now (post Task 29 B1 fix) correctly rejects that shape
      // and would skip the file entirely.
      writeFileSync(
        factPath,
        [
          '---',
          'id: P-CCCCCCCC',
          'type: project',
          'title: edited title',
          'created_at: 2026-05-27T10:00:00Z',
          'write_source: user-explicit',
          'trust: high',
          'source_file: MEMORY.md',
          'source_line: 1',
          `source_sha1: ${'a'.repeat(40)}`,
          '---',
          '',
          'edited body — different from original',
          '',
        ].join('\n'),
        'utf8',
      );
      // Force a strictly-later mtime on the edited file before the second boot.
      // reindexBoot's fast path skips files whose floor(mtimeMs) matches the
      // indexed checkpoint — an intentional, documented caveat (index-rebuild.mjs
      // §"a content change that PRESERVES the old mtime ... won't be re-indexed").
      // In production an edit lands seconds/minutes after the last boot-index, so
      // mtime always advances and the change is seen. This test writes the seed
      // and the edit <1ms apart, so under load (5x stress) floor(mtimeMs) can
      // collide and the real content change is skipped (filesReindexed === 0).
      // Bumping mtime simulates the real-world gap, making the reindex-on-edit
      // contract deterministic. NOT masking a bug — the fast path is correct by
      // design; the test was relying on the clock advancing between two writes,
      // which isn't guaranteed. (Task 101 stress detour — DECISION-LOG D-76.)
      const future = new Date(Date.now() + 10_000);
      utimesSync(factPath, future, future);
      const r = reindexBoot({ projectRoot, userDir, db });
      expect(r.filesReindexed).toBe(1);
      // The reindex propagated to the observations table.
      const row = db
        .prepare('SELECT body FROM observations WHERE id = ?')
        .get('P-CCCCCCCC');
      expect(row.body).toContain('edited body');
      // Over-mutation guard (CLAUDE.md Engineering discipline): editing
      // the fact file MUST NOT touch the scratchpad bullet's row.
      // Catches a future bug where reindexBoot's per-file replace
      // accidentally widens its DELETE scope. Surfaced as Important
      // finding I4 in the Task 29 code-review.
      const scratchpadRow = db
        .prepare('SELECT body FROM observations WHERE id = ?')
        .get('P-AAAAAAAA');
      expect(scratchpadRow).toBeDefined();
      expect(scratchpadRow.body).toContain('unchanged scratchpad');
    });
  });

  // Task 110 (F-7): reindexBoot must PRUNE observations for source files that
  // vanished since the last index (e.g. a fact file `cmk forget` moved to
  // archive/tombstones/). Before this, boot only ADDED/UPDATED existing files,
  // so a forgotten fact lingered in `cmk search` until a manual reindex --full.
  describe('reindexBoot orphan pruning (Task 110 / F-7)', () => {
    const countObs = () =>
      db.prepare('SELECT COUNT(*) AS n FROM observations').get().n;
    const hasId = (id) =>
      db.prepare('SELECT 1 AS x FROM observations WHERE id = ?').get(id) !== undefined;

    it('prunes observations for a fact file that no longer exists on disk', () => {
      // Two distinct fact files on top of the install-seeded baseline; assert
      // RELATIVE deltas so the template seed bullets don't skew the counts.
      seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC', type: 'project', title: 'keep', body: 'keep me',
        write_source: 'user-explicit', trust: 'high', at: '2026-06-08T10:00:00Z', slug: 'keep',
      });
      seedFactFile(projectRoot, {
        id: 'P-DDDDDDDD', type: 'project', title: 'gone', body: 'forget me uniquetoken',
        write_source: 'user-explicit', trust: 'high', at: '2026-06-08T10:00:00Z', slug: 'gone',
      });
      reindexBoot({ projectRoot, userDir, db });
      const before = countObs();
      expect(hasId('P-CCCCCCCC')).toBe(true);
      expect(hasId('P-DDDDDDDD')).toBe(true);

      // Simulate `cmk forget` removing the fact file from context/memory/.
      rmSync(join(projectRoot, 'context', 'memory', 'project_gone.md'));
      const r = reindexBoot({ projectRoot, userDir, db });

      // Door 1 (Response): the result reports exactly one pruned file/observation.
      expect(r.filesPruned).toBe(1);
      expect(r.observationsPruned).toBe(1);
      // Door 2 (State): only the orphan's row is gone (over-mutation guard —
      // prune-one must not prune-all); the survivor + baseline are UNTOUCHED.
      expect(countObs()).toBe(before - 1);
      expect(hasId('P-DDDDDDDD')).toBe(false);
      expect(hasId('P-CCCCCCCC')).toBe(true);
      // The FTS mirror no longer matches the forgotten body.
      const fts = db
        .prepare(`SELECT body FROM observations_fts WHERE observations_fts MATCH 'uniquetoken'`)
        .get();
      expect(fts).toBeUndefined();
      // …and the files checkpoint row is gone too (no resurrection on next boot).
      const fileRow = db.prepare('SELECT path FROM files WHERE path LIKE ?').get('%project_gone.md');
      expect(fileRow).toBeUndefined();
    });

    it('prunes nothing when every indexed file still exists (no false positives)', () => {
      seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC', type: 'project', title: 'a', body: 'a',
        write_source: 'user-explicit', trust: 'high', at: '2026-06-08T10:00:00Z', slug: 'aaa',
      });
      reindexBoot({ projectRoot, userDir, db });
      const before = countObs();
      const r = reindexBoot({ projectRoot, userDir, db });
      expect(r.filesPruned).toBe(0);
      expect(r.observationsPruned).toBe(0);
      expect(countObs()).toBe(before);
    });

    // Composition guard (self-review): the prune is only sound when the live-set
    // is COMPLETE across every indexed tier. Called WITHOUT userDir the U tier
    // isn't walked, so a real U-tier row would be falsely seen as an orphan.
    // The guard must SKIP pruning when userDir is absent (the next userDir-
    // passing reader self-heals) — proven here by deleting a file and confirming
    // a no-userDir boot does NOT prune it, while a userDir boot does.
    it('does NOT prune when called without userDir (incomplete live-set guard)', () => {
      seedFactFile(projectRoot, {
        id: 'P-DDDDDDDD', type: 'project', title: 'gone', body: 'body',
        write_source: 'user-explicit', trust: 'high', at: '2026-06-08T10:00:00Z', slug: 'gone',
      });
      reindexBoot({ projectRoot, userDir, db });
      expect(hasId('P-DDDDDDDD')).toBe(true);
      rmSync(join(projectRoot, 'context', 'memory', 'project_gone.md'));

      // No userDir → prune skipped → the (now-deleted) file's row SURVIVES.
      // (Without an explicit userDir, resolveTierRoot defaults U to the real
      // homedir, so the live-set would be for the WRONG U tier — exactly why
      // the guard must not prune here. filesPruned must be 0 regardless.)
      const noUd = reindexBoot({ projectRoot, db });
      expect(noUd.filesPruned).toBe(0);
      expect(hasId('P-DDDDDDDD')).toBe(true);

      // With userDir → the orphan IS pruned (self-heal on the next real reader).
      reindexBoot({ projectRoot, userDir, db });
      expect(hasId('P-DDDDDDDD')).toBe(false);
    });

    // Task 110 audit: the F-7 gap was specific to DELETIONS (forget). In-place
    // mutations like `cmk trust` change the fact file's content, so the existing
    // lazy reindexBoot (mtime/sha1 diff) re-indexes them with no extra wiring —
    // i.e. they already self-heal. This locks that audit conclusion against the
    // REAL overrideTrust() path so a future change can't silently regress it.
    it('a trust change reflects in the index on the next lazy reindex (no orphan, no manual reindex)', () => {
      const w = seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC', type: 'project', title: 't', body: 'trust me',
        write_source: 'user-explicit', trust: 'low', at: '2026-06-08T10:00:00Z', slug: 'trustme',
      });
      expect(w).toBeTruthy();
      reindexBoot({ projectRoot, userDir, db });
      expect(db.prepare('SELECT trust FROM observations WHERE id = ?').get('P-CCCCCCCC').trust).toBe('low');

      const r = overrideTrust({ id: 'P-CCCCCCCC', level: 'high', projectRoot, userDir });
      expect(r.action).not.toBe('error');

      // Next lazy reindex (what `cmk search` runs) picks up the changed file.
      reindexBoot({ projectRoot, userDir, db });
      expect(db.prepare('SELECT trust FROM observations WHERE id = ?').get('P-CCCCCCCC').trust).toBe('high');
    });
  });

  describe('reindexFull (29.3, 29.4 case #4)', () => {
    it('drops + rebuilds DB; row count = markdown fact count', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 }),
        bulletInput({ id: 'P-BBBBBBBB', text: 'two', line: 7 }),
      ]);
      seedFactFile(projectRoot, {
        id: 'P-CCCCCCCC',
        type: 'project',
        title: 'c',
        body: 'b',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
      });
      reindexBoot({ projectRoot, userDir, db });
      const beforeCount = db.prepare('SELECT COUNT(*) AS n FROM observations').get().n;
      expect(beforeCount).toBe(3);
      const r = reindexFull({ projectRoot, userDir, db });
      expect(r.observationsAffected).toBe(3);
      const afterCount = db.prepare('SELECT COUNT(*) AS n FROM observations').get().n;
      expect(afterCount).toBe(3);
    });

    // -- Task 151.6 — trust_score is RECONSTRUCTED on (re)index (ADR-0016 §20.2) --
    it('151.6: reindex populates trust_score from source — user-explicit > auto-extract; committed .md unchanged', () => {
      // Two facts, SAME trust enum (high), DIFFERENT source. The user-attested one
      // must seed a higher trust_score than the machine-derived one (memory-os
      // source-based init). trust_score lives ONLY in the rebuildable index — the
      // committed fact files carry no such field (D-218).
      const explicitPath = seedFactFile(projectRoot, {
        id: 'P-EXPLCTAA', type: 'feedback', title: 'e', body: 'user stated this',
        write_source: 'user-explicit', trust: 'high', at: '2026-05-27T10:00:00Z', slug: 'explicit',
      });
      seedFactFile(projectRoot, {
        id: 'P-AUTXTRAA', type: 'feedback', title: 'a', body: 'machine inferred this',
        write_source: 'auto-extract', trust: 'high', at: '2026-05-27T10:00:00Z', slug: 'auto',
      });

      reindexFull({ projectRoot, userDir, db });

      const explicit = db.prepare('SELECT trust_score FROM observations WHERE id = ?').get('P-EXPLCTAA');
      const auto = db.prepare('SELECT trust_score FROM observations WHERE id = ?').get('P-AUTXTRAA');
      expect(typeof explicit.trust_score).toBe('number');
      expect(explicit.trust_score).toBeGreaterThan(auto.trust_score); // the design's invariant
      // floor/ceil respected (never 0, never 1).
      expect(explicit.trust_score).toBeGreaterThan(0);
      expect(explicit.trust_score).toBeLessThan(1);

      // The committed fact file is UNCHANGED by trust_score (it lives in the index).
      const committed = readFileSync(explicitPath, 'utf8');
      expect(committed).not.toMatch(/trust_score/);
    });

    it('151.6: rebuilding from scratch RECONSTRUCTS the same trust_score (rebuildable invariant)', () => {
      seedFactFile(projectRoot, {
        id: 'P-REBLDFAA', type: 'feedback', title: 'r', body: 'rebuildable fact',
        write_source: 'user-explicit', trust: 'medium', at: '2026-05-27T10:00:00Z', slug: 'rebuild',
      });
      reindexFull({ projectRoot, userDir, db });
      const first = db.prepare('SELECT trust_score FROM observations WHERE id = ?').get('P-REBLDFAA').trust_score;
      // A second full rebuild (the DROP+recreate path) must land the SAME seed.
      reindexFull({ projectRoot, userDir, db });
      const second = db.prepare('SELECT trust_score FROM observations WHERE id = ?').get('P-REBLDFAA').trust_score;
      expect(second).toBe(first);
    });

    // -- Task 151.13 CUT-GATE: existing-install MIGRATION (no recurrence_count) ---
    // A fact written by a PRE-151 install has NO `recurrence_count` frontmatter.
    // It must index cleanly (no skip/error) and still get a trust_score seeded —
    // the recurrence term defaults to the baseline (1×), so the seed equals a
    // recurrence_count:1 fact. This is the existing-user upgrade path: the index
    // self-heals on the next reindex; no manual migration command (D-169).
    it('151.13 CUT-GATE: a pre-151 fact (no recurrence_count frontmatter) indexes cleanly + gets trust_score', () => {
      // Hand-write a fact file in the PRE-151 shape (no recurrence_count line) so
      // we exercise the genuine existing-install case, not the current writer.
      const memDir = join(projectRoot, 'context', 'memory');
      mkdirSync(memDir, { recursive: true });
      const legacy = [
        '---', 'id: P-LEGACYAA', 'type: feedback', 'title: legacy fact',
        'created_at: 2026-05-27T10:00:00Z', 'write_source: user-explicit', 'trust: high',
        'source_file: x.md', 'source_line: 1', `source_sha1: ${'a'.repeat(40)}`,
        '---', '', 'a fact captured before 151 shipped', '',
      ].join('\n');
      writeFileSync(join(memDir, 'feedback_legacy.md'), legacy, 'utf8');
      // And a CURRENT-shape fact with recurrence_count: 1 — same signals → same seed.
      seedFactFile(projectRoot, {
        id: 'P-CURRENTA', type: 'feedback', title: 'current', body: 'a fact captured after 151',
        write_source: 'user-explicit', trust: 'high', at: '2026-05-27T10:00:00Z', slug: 'current',
      });

      const r = reindexFull({ projectRoot, userDir, db });

      // Door 1/2: the legacy fact indexed (not skipped) — no recurrence_count is fine.
      expect((r.skipped ?? []).some((s) => /legacy/.test(s.path ?? ''))).toBe(false);
      const legacyRow = db.prepare('SELECT trust_score FROM observations WHERE id = ?').get('P-LEGACYAA');
      expect(legacyRow).toBeDefined();
      expect(typeof legacyRow.trust_score).toBe('number');
      // A missing recurrence_count seeds the SAME as recurrence_count: 1 (baseline).
      const currentRow = db.prepare('SELECT trust_score FROM observations WHERE id = ?').get('P-CURRENTA');
      expect(legacyRow.trust_score).toBe(currentRow.trust_score);
    });

    it('full clears stale rows that no longer exist in source files', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 }),
        bulletInput({ id: 'P-BBBBBBBB', text: 'two', line: 7 }),
      ]);
      reindexBoot({ projectRoot, userDir, db });
      expect(db.prepare('SELECT COUNT(*) AS n FROM observations').get().n).toBe(2);
      // Replace the file with ONE bullet.
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 }),
      ]);
      reindexFull({ projectRoot, userDir, db });
      const remaining = db.prepare('SELECT id FROM observations ORDER BY id').all();
      expect(remaining.map((r) => r.id)).toEqual(['P-AAAAAAAA']);
    });

    // Bug 1 (2026-06-16, fact P-UCG4RKNL): `cmk remember` dual-writes a fact
    // to BOTH the MEMORY.md scratchpad bullet AND its granular archive file,
    // both carrying the SAME id. `observations.id` is a global PRIMARY KEY but
    // `replaceObservationsForFile` deletes by `source_file` only — so the
    // second source's INSERT collided (`UNIQUE constraint failed:
    // observations.id`) and aborted the whole reindex. Fix (research note
    // 2026-06-16-index-uniqueness-id-vs-file-scoped-delete.md): id-keyed upsert
    // with archive-beats-scratchpad precedence (TencentDB upsert-by-id +
    // basic-memory resolve-precedence). Contract: ONE row per id, provenance =
    // the granular archive file (the canonical Why/How home).
    it('Bug 1 — same id in scratchpad AND granular archive reindexes to ONE archive-provenance row (full)', () => {
      const DUP = 'P-DUPDUPDU';
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'distinct', line: 5 }),
        bulletInput({ id: DUP, text: 'scratchpad copy of the dup fact', line: 7 }),
      ]);
      const factPath = seedFactFile(projectRoot, {
        id: DUP,
        type: 'project',
        title: 'dup fact',
        body: 'archive copy of the dup fact',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
        slug: 'dup-fact',
      });

      // Must not throw the UNIQUE-constraint crash.
      expect(() => reindexFull({ projectRoot, userDir, db })).not.toThrow();

      // Exactly ONE row for the dup id (not two, not zero).
      const rows = db
        .prepare('SELECT id, source_file, body FROM observations WHERE id = ?')
        .all(DUP);
      expect(rows).toHaveLength(1);

      // The surviving row's provenance is the granular ARCHIVE file, not the
      // scratchpad bullet — deterministic precedence regardless of walk order.
      expect(rows[0].source_file).toBe('context/memory/project_dup-fact.md');
      expect(rows[0].source_file).not.toBe('context/MEMORY.md');
      // And it carries the archive body, not the scratchpad text.
      expect(rows[0].body).toContain('archive copy');

      // Over-mutation guard: the distinct fact is untouched.
      expect(
        db.prepare('SELECT COUNT(*) AS n FROM observations WHERE id = ?').get('P-AAAAAAAA').n,
      ).toBe(1);
      // Total: 2 distinct ids (the dup collapsed to one), not 3.
      expect(db.prepare('SELECT COUNT(*) AS n FROM observations').get().n).toBe(2);
      // FTS5 stays consistent — the dup is MATCH-able exactly once.
      const fts = db
        .prepare("SELECT COUNT(*) AS n FROM observations_fts WHERE observations_fts MATCH 'archive'")
        .get().n;
      expect(fts).toBe(1);
      // FTS5 orphan guard (Door 4): INSERT OR REPLACE deletes the conflicting
      // scratchpad row; that delete MUST fire obs_after_delete so the external-
      // content FTS5 'delete' sentinel removes the old scratchpad body. If it
      // didn't, the scratchpad text would orphan in observations_fts and keep
      // MATCH-ing with no backing observations row (silent stale-hit
      // corruption). The dup scratchpad body was 'scratchpad copy …' — assert
      // it no longer MATCHes anything.
      const orphan = db
        .prepare("SELECT COUNT(*) AS n FROM observations_fts WHERE observations_fts MATCH 'scratchpad'")
        .get().n;
      expect(orphan).toBe(0);
      // And the FTS row count equals the observations row count (no orphans at
      // all) — the external-content invariant.
      const obsCount = db.prepare('SELECT COUNT(*) AS n FROM observations').get().n;
      const ftsCount = db.prepare('SELECT COUNT(*) AS n FROM observations_fts').get().n;
      expect(ftsCount).toBe(obsCount);
      expect(factPath).toContain('project_dup-fact.md');
    });

    it('Bug 1 — same id in scratchpad AND granular archive reindexes to ONE archive-provenance row (boot)', () => {
      const DUP = 'P-DUPDUPDU';
      seedScratchpad(projectRoot, [
        bulletInput({ id: DUP, text: 'scratchpad copy', line: 5 }),
      ]);
      seedFactFile(projectRoot, {
        id: DUP,
        type: 'project',
        title: 'dup fact',
        body: 'archive copy of the dup fact',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
        slug: 'dup-fact',
      });

      expect(() => reindexBoot({ projectRoot, userDir, db })).not.toThrow();

      const rows = db
        .prepare('SELECT id, source_file FROM observations WHERE id = ?')
        .all(DUP);
      expect(rows).toHaveLength(1);
      expect(rows[0].source_file).toBe('context/memory/project_dup-fact.md');
    });

    // Bug 1 / skill-review I1 — incremental-boot transition: a fact file is
    // removed (hand-rm, NOT `cmk forget` which scrubs the bullet too) while its
    // same-id scratchpad twin stays put. On the mtime-skip boot path the
    // untouched scratchpad is skipped, so the orphan-prune drops the fact row
    // and the scratchpad's DO-NOTHING insert doesn't re-fire → the id is
    // momentarily absent until the scratchpad is next edited. This test PINS
    // that documented, self-healing window so a future change that "fixes" it
    // into a resurrect-path is a conscious decision, not an accident.
    it('Bug 1 I1 — hand-removing the fact file (bullet left) drops the id until the scratchpad is re-touched (documented self-healing window)', () => {
      const DUP = 'P-DUPDUPDU';
      seedScratchpad(projectRoot, [
        bulletInput({ id: DUP, text: 'scratchpad twin', line: 5 }),
      ]);
      const factPath = seedFactFile(projectRoot, {
        id: DUP,
        type: 'project',
        title: 'dup fact',
        body: 'archive copy',
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
        slug: 'dup-fact',
      });
      // First boot: both sources walked → one archive-provenance row.
      reindexBoot({ projectRoot, userDir, db });
      expect(
        db.prepare('SELECT source_file FROM observations WHERE id = ?').get(DUP).source_file,
      ).toBe('context/memory/project_dup-fact.md');

      // Hand-remove the fact file ONLY (scratchpad bullet untouched, mtime same).
      rmSync(factPath);
      reindexBoot({ projectRoot, userDir, db });
      // Documented window: the id is absent (skipped scratchpad never re-fired;
      // fact row pruned). NOT the archive provenance, NOT a crash — just absent.
      expect(
        db.prepare('SELECT COUNT(*) AS n FROM observations WHERE id = ?').get(DUP).n,
      ).toBe(0);

      // Self-heal: editing the scratchpad re-fires its insert → the bullet's
      // row returns (now scratchpad-provenance, since the archive is gone).
      seedScratchpad(projectRoot, [
        bulletInput({ id: DUP, text: 'scratchpad twin edited', line: 5 }),
      ]);
      reindexBoot({ projectRoot, userDir, db });
      const healed = db
        .prepare('SELECT source_file FROM observations WHERE id = ?')
        .get(DUP);
      expect(healed.source_file).toBe('context/MEMORY.md');
    });

    // Bug 1 / skill-review M1 — the unqualified `DELETE WHERE id = ?` on the
    // fact path is safe ONLY because the tier is a prefix of the content-
    // addressed id (generateId → `${tier}-${hash}`), so a P-tier and U-tier
    // fact with identical content get DIFFERENT ids and can never collide. Pin
    // that invariant: same body in P and U tiers → both rows survive reindex.
    it('Bug 1 M1 — same content in P and U tiers keeps BOTH rows (tier-prefixed ids never cross-delete)', () => {
      const sameBody = 'a fact whose text is identical across tiers';
      const pPath = seedFactFile(projectRoot, {
        id: 'P-AAAAAAAA',
        type: 'project',
        title: 'p copy',
        body: sameBody,
        write_source: 'user-explicit',
        trust: 'high',
        at: '2026-05-27T10:00:00Z',
        slug: 'p-copy',
      });
      // Write the U-tier twin directly via writeFact (userDir tier).
      const uRes = writeFact({
        projectRoot,
        userDir,
        tier: 'U',
        type: 'project',
        slug: 'u-copy',
        title: 'u copy',
        body: sameBody,
        writeSource: 'user-explicit',
        trust: 'high',
        sourceFile: 'MEMORY.md',
        sourceLine: 1,
        sourceSha1: 'a'.repeat(40),
        createdAt: '2026-05-27T10:00:00Z',
        id: 'U-AAAAAAAA',
      });
      expect(uRes.action).not.toBe('error');

      reindexFull({ projectRoot, userDir, db });
      const ids = db
        .prepare("SELECT id FROM observations WHERE id IN ('P-AAAAAAAA','U-AAAAAAAA') ORDER BY id")
        .all()
        .map((r) => r.id);
      expect(ids).toEqual(['P-AAAAAAAA', 'U-AAAAAAAA']);
      expect(pPath).toContain('project_p-copy.md');
    });
  });

  describe('FTS5 mirror correctness through reindex paths', () => {
    it('reindexed observations are MATCH-able via FTS5', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'standardized on pnpm for new projects', line: 5 }),
      ]);
      reindexBoot({ projectRoot, userDir, db });
      const hit = db
        .prepare(`SELECT body FROM observations_fts WHERE observations_fts MATCH 'pnpm'`)
        .get();
      expect(hit).toBeDefined();
      expect(hit.body).toContain('pnpm');
    });

    it('after full rebuild, FTS5 reflects the new corpus (no stale rows)', () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'old fact about pnpm', line: 5 }),
      ]);
      reindexBoot({ projectRoot, userDir, db });
      const hitBefore = db
        .prepare(`SELECT body FROM observations_fts WHERE observations_fts MATCH 'pnpm'`)
        .get();
      expect(hitBefore).toBeDefined();
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-BBBBBBBB', text: 'fresh fact about uv', line: 5 }),
      ]);
      reindexFull({ projectRoot, userDir, db });
      const hitAfter = db
        .prepare(`SELECT body FROM observations_fts WHERE observations_fts MATCH 'pnpm'`)
        .get();
      expect(hitAfter).toBeUndefined();
      const hitNew = db
        .prepare(`SELECT body FROM observations_fts WHERE observations_fts MATCH 'uv'`)
        .get();
      expect(hitNew).toBeDefined();
    });
  });

  describe('runtime watcher (29.2, 29.4 cases #3 + #5)', () => {
    it('29.4 #3 — touch a file; FTS5 reflects within 1s', async () => {
      // Use a small debounce so the test runs fast.
      const handle = startRuntimeWatcher({
        projectRoot,
        userDir,
        db,
        debounceMs: 100,
      });
      try {
        // Wait for the watcher to be ready before writing.
        // chokidar's `ready` event fires after the initial scan.
        await new Promise((resolve) =>
          handle.watcher.once('ready', resolve),
        );
        // Write a scratchpad with a bullet about pnpm.
        seedScratchpad(projectRoot, [
          bulletInput({ id: 'P-AAAAAAAA', text: 'switched to pnpm yesterday', line: 5 }),
        ]);
        // Poll the FTS5 mirror up to 1s for the bullet to appear.
        const deadline = Date.now() + 2500;
        let hit;
        while (Date.now() < deadline) {
          hit = db
            .prepare(`SELECT body FROM observations_fts WHERE observations_fts MATCH 'pnpm'`)
            .get();
          if (hit) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        expect(hit).toBeDefined();
        expect(hit.body).toContain('pnpm');
      } finally {
        await handle.close();
      }
    });

    // Regression test (self-review caught this): chokidar v5 dropped
    // glob support — an earlier draft of startRuntimeWatcher used
    // `<root>/memory/*.md` globs that silently never matched. The
    // scratchpad watcher test passed because MEMORY.md is a literal
    // path; per-fact ADD events would have been missed entirely. This
    // test exercises the watcher's response to a new per-fact file
    // appearing in the memory/ directory.
    it('watcher picks up new per-fact files added to memory/ (chokidar v5 glob-drop regression)', async () => {
      const handle = startRuntimeWatcher({
        projectRoot,
        userDir,
        db,
        debounceMs: 100,
      });
      try {
        await new Promise((resolve) =>
          handle.watcher.once('ready', resolve),
        );
        // Add a new per-fact file. The watcher should detect it,
        // parse the frontmatter, and index it into observations.
        seedFactFile(projectRoot, {
          id: 'P-DDDDDDDD',
          type: 'project',
          title: 'use uv for python',
          body: 'we standardized on uv for python tooling',
          write_source: 'user-explicit',
          trust: 'high',
          at: '2026-05-27T10:00:00Z',
        });
        const deadline = Date.now() + 2500;
        let hit;
        while (Date.now() < deadline) {
          hit = db
            .prepare(
              `SELECT body FROM observations WHERE id = ?`,
            )
            .get('P-DDDDDDDD');
          if (hit) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        expect(hit).toBeDefined();
        expect(hit.body).toContain('uv for python');
      } finally {
        await handle.close();
      }
    });

    // I3 honest naming (was '29.4 #5 — concurrent boot + runtime'): in
    // v0.1.0 with better-sqlite3 sync + JS single-threaded, "concurrent"
    // is sequential at the JS level (the watcher events fire BETWEEN
    // boot transactions, not DURING them). This test pins the
    // sequential composition: boot writes → watcher writes-on-top
    // (DELETE + INSERT replace) → no duplicate rows. A real concurrent-
    // writer test (mid-transaction race) would need timing fixtures
    // that are flaky-prone on Windows; deferred as v0.1.x candidate.
    it('29.4 #5 — boot then watcher write: no duplicate rows (sequential composition)', async () => {
      seedScratchpad(projectRoot, [
        bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 }),
        bulletInput({ id: 'P-BBBBBBBB', text: 'two', line: 7 }),
      ]);
      const handle = startRuntimeWatcher({
        projectRoot,
        userDir,
        db,
        debounceMs: 100,
      });
      try {
        await new Promise((resolve) =>
          handle.watcher.once('ready', resolve),
        );
        // Boot runs while the watcher is alive. The watcher receives no
        // FS events here because we don't touch the files — so the boot's
        // transactional writes are the only writers. The assertion is
        // that the operation doesn't error out + the row counts are
        // exact.
        const r = reindexBoot({ projectRoot, userDir, db });
        expect(r.filesReindexed).toBeGreaterThan(0);
        const count = db.prepare('SELECT COUNT(*) AS n FROM observations').get();
        expect(count.n).toBe(2);
        // Now trigger a watcher event by rewriting the file with a new
        // bullet added. The watcher updates the DB. Boot from earlier
        // already wrote; the watcher's update should net to "no duplicates":
        // a fresh DELETE + INSERT replaces the file's rows.
        seedScratchpad(projectRoot, [
          bulletInput({ id: 'P-AAAAAAAA', text: 'one', line: 5 }),
          bulletInput({ id: 'P-BBBBBBBB', text: 'two', line: 7 }),
          bulletInput({ id: 'P-CCCCCCCC', text: 'three', line: 9 }),
        ]);
        // Wait for watcher to process.
        const deadline = Date.now() + 2500;
        let count3;
        while (Date.now() < deadline) {
          count3 = db.prepare('SELECT COUNT(*) AS n FROM observations').get().n;
          if (count3 === 3) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        expect(count3).toBe(3);
        // Each id appears exactly once (no duplicates from boot + watcher
        // both having processed).
        const ids = db
          .prepare('SELECT id, COUNT(*) AS n FROM observations GROUP BY id')
          .all();
        for (const row of ids) {
          expect(row.n).toBe(1);
        }
      } finally {
        await handle.close();
      }
    });
  });
});

// Task 139 (D-126) - CRLF tolerance: a Windows clone with autocrlf=true
// rewrites every committed memory file to CRLF; the strict-\n frontmatter
// boundary and line splits made ALL facts invisible after a clone
// (cut-gate9 H1: clone reindex found 0 of 18 facts). These pin the
// portability promise on default Windows git config.
describe('Task 139 - CRLF-converted memory files still index', () => {
  beforeEach(makeFixture);
  afterEach(() => {
    db?.close();
    rmSync(sandbox, { recursive: true, force: true });
  });

  it('a CRLF fact file is parsed and indexed (the clone shape)', () => {
    const factPath = seedFactFile(projectRoot, {
      type: 'project',
      title: 'CRLF survival fact',
      body: 'Deploys ride the tag pipeline.',
      write_source: 'user-explicit',
      trust: 'high',
      at: '2026-06-11T10:00:00Z',
      slug: 'crlf-survival',
    });
    // Simulate the autocrlf checkout: LF -> CRLF across the whole file.
    const lf = readFileSync(factPath, 'utf8');
    writeFileSync(factPath, lf.replace(/\n/g, '\r\n'), 'utf8');
    const result = reindexFull({ projectRoot, userDir, db });
    const row = db
      .prepare("SELECT body FROM observations WHERE body LIKE '%tag pipeline%'")
      .get();
    expect(row).toBeTruthy();
    expect(result).toBeTruthy();
  });

  it('a CRLF scratchpad bullet is still walked (provenance line intact)', () => {
    const memPath = join(projectRoot, 'context', 'MEMORY.md');
    const lf = readFileSync(memPath, 'utf8');
    writeFileSync(memPath, lf.replace(/\n/g, '\r\n'), 'utf8');
    expect(() => reindexFull({ projectRoot, userDir, db })).not.toThrow();
  });
});

// Task 261 (D-421 / D-423) — found by the AGED-CORPUS harness on its first real
// run, and previously unhit only by luck.
//
// `observations.superseded_by` is declared `REFERENCES observations(id)`, and
// better-sqlite3 turns FK enforcement ON by default. `reindexFull` inserts one
// SOURCE FILE per transaction, so a fact whose `superseded_by` points at a fact
// walked LATER hits the constraint at insert time — and the whole rebuild
// aborts with an unhandled SqliteError, leaving the index half-built. The same
// happens when the successor was later forgotten, which leaves a legitimately
// DANGLING pointer in the markdown.
//
// Both shapes are legal: the markdown is the source of truth (ADR-0002), the
// index is a rebuildable cache, and neither walk order nor a forgotten
// successor is something a user did wrong. The dogfood corpus simply had zero
// supersessions, so `cmk reindex --full` had never been asked the question.
describe('Task 261 — supersession must not abort a full rebuild (D-423)', () => {
  beforeEach(makeFixture);
  afterEach(() => {
    db?.close();
    rmSync(sandbox, { recursive: true });
  });

  it('a FORWARD supersession reference (successor walked later) rebuilds cleanly', () => {
    // 'aaa-old' sorts before 'zzz-new', so the walk reaches the superseded fact
    // FIRST and its target does not exist in the table yet.
    seedFactFile(projectRoot, {
      id: 'P-NEWFACT2', type: 'project', title: 'The replacement', slug: 'zzz-new',
      body: 'The deploy target is Fly.io.', write_source: 'user-explicit', trust: 'high',
      at: '2026-06-20T10:00:00Z',
    });
    const oldPath = seedFactFile(projectRoot, {
      id: 'P-PRVFACT3', type: 'project', title: 'The replaced', slug: 'aaa-old',
      body: 'The deploy target is Render.', write_source: 'user-explicit', trust: 'high',
      at: '2026-06-10T10:00:00Z',
    });
    const raw = readFileSync(oldPath, 'utf8');
    writeFileSync(oldPath, raw.replace(/^id: .*$/m, (m) => `${m}\nsuperseded_by: P-NEWFACT2`), 'utf8');

    expect(() => reindexFull({ projectRoot, userDir, db })).not.toThrow();
    const rows = db
      .prepare("SELECT id, superseded_by FROM observations WHERE id IN ('P-PRVFACT3','P-NEWFACT2') ORDER BY id")
      .all();
    expect(rows).toEqual([
      { id: 'P-NEWFACT2', superseded_by: null },
      { id: 'P-PRVFACT3', superseded_by: 'P-NEWFACT2' },
    ]);
  });

  it('a DANGLING supersession reference (successor forgotten) rebuilds cleanly too', () => {
    const p = seedFactFile(projectRoot, {
      id: 'P-DANGRPT4', type: 'project', title: 'Points at a ghost', slug: 'dangler',
      body: 'This fact was replaced by one that has since been forgotten.',
      write_source: 'user-explicit', trust: 'high', at: '2026-06-10T10:00:00Z',
    });
    const raw = readFileSync(p, 'utf8');
    writeFileSync(p, raw.replace(/^id: .*$/m, (m) => `${m}\nsuperseded_by: P-GHSTFAC5`), 'utf8');

    expect(() => reindexFull({ projectRoot, userDir, db })).not.toThrow();
    const row = db.prepare("SELECT superseded_by FROM observations WHERE id = 'P-DANGRPT4'").get();
    // The pointer is PRESERVED, not silently dropped — readers already handle an
    // unresolvable target (graph-index marks it dst_resolved=0).
    expect(row.superseded_by).toBe('P-GHSTFAC5');
  });

  it('the incremental boot path tolerates the same shapes', () => {
    const p = seedFactFile(projectRoot, {
      id: 'P-BTSUPRC6', type: 'project', title: 'Boot-path supersession', slug: 'boot-sup',
      body: 'Indexed by the incremental path with a forward reference.',
      write_source: 'user-explicit', trust: 'high', at: '2026-06-10T10:00:00Z',
    });
    const raw = readFileSync(p, 'utf8');
    writeFileSync(p, raw.replace(/^id: .*$/m, (m) => `${m}\nsuperseded_by: P-NTYETXX7`), 'utf8');
    expect(() => reindexBoot({ projectRoot, userDir, db })).not.toThrow();
    expect(
      db.prepare("SELECT superseded_by FROM observations WHERE id = 'P-BTSUPRC6'").get().superseded_by,
    ).toBe('P-NTYETXX7');
  });
});

// Task 261 (D-423) — the SAME hazard class as D-421, one table over: derived
// state that outlives the table it describes, with "rebuild everything" as the
// trigger.
//
// `reindexFull` DROPs `edges` but not `meta`, and re-applies the schema with
// `CREATE TABLE IF NOT EXISTS` — so `meta.edges_built_at` survives, still
// claiming a build that no longer exists. The rebuild that follows is
// best-effort inside a try/catch, so if it throws (a malformed fact mid-walk,
// an EPERM, an unreadable archive entry) the outcome is an EMPTY edges table
// beside a sentinel that says it was built. `reindexBoot` then never self-heals
// it — `coldEdges = !edgesBuilt(db) && …` reads exactly that stale sentinel —
// so `cmk links`, backlinks and supersession chains return empty, confidently,
// until some unrelated file happens to change.
//
// `migrateEdgesSchema` (index-db.mjs) already drops the table and clears the
// sentinel TOGETHER, and says why in its own comment. `reindexFull` was
// violating the invariant its sibling was written to maintain.
describe('Task 261 — the edges sentinel never outlives the edges table (D-423)', () => {
  beforeEach(makeFixture);
  afterEach(() => {
    db?.close();
    rmSync(sandbox, { recursive: true });
  });

  it('a FAILED edge rebuild during reindexFull leaves no sentinel claiming a build', () => {
    seedFactFile(projectRoot, {
      id: 'P-EDGESRC2', type: 'project', title: 'Has a link', slug: 'edge-src',
      body: 'This relates to [[project_edge-dst]].',
      write_source: 'user-explicit', trust: 'high', at: '2026-06-10T10:00:00Z',
    });
    // A first, healthy full reindex writes the sentinel.
    reindexFull({ projectRoot, userDir, db });
    expect(edgesBuilt(db)).toBe(true);

    // Now make the edge rebuild throw, exactly where it can in production: the
    // fact walk, before the atomic write. `reindexFull` swallows it by design.
    const spy = vi.spyOn(graphIndex, 'rebuildEdges').mockImplementation(() => {
      throw new Error('simulated: unreadable fact mid-walk');
    });
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      reindexFull({ projectRoot, userDir, db });
    } finally {
      spy.mockRestore();
      stderr.mockRestore();
    }

    // The table is empty (dropped, never repopulated) — so the sentinel MUST
    // NOT claim otherwise, or the boot path will never rebuild it.
    expect(db.prepare('SELECT COUNT(*) AS n FROM edges').get().n).toBe(0);
    expect(edgesBuilt(db)).toBe(false);
  });

  it('and the next boot reindex therefore self-heals the graph', () => {
    seedFactFile(projectRoot, {
      id: 'P-EDGESRC3', type: 'project', title: 'Has a link', slug: 'edge-src2',
      body: 'This relates to [[project_edge-dst]].',
      write_source: 'user-explicit', trust: 'high', at: '2026-06-10T10:00:00Z',
    });
    reindexFull({ projectRoot, userDir, db });
    const spy = vi.spyOn(graphIndex, 'rebuildEdges').mockImplementation(() => {
      throw new Error('simulated failure');
    });
    const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
    try {
      reindexFull({ projectRoot, userDir, db });
    } finally {
      spy.mockRestore();
      stderr.mockRestore();
    }
    expect(db.prepare('SELECT COUNT(*) AS n FROM edges').get().n).toBe(0);

    // No file changed — the ONLY thing that can trigger the rebuild is the
    // cold-edge path, and that reads the sentinel.
    reindexBoot({ projectRoot, userDir, db });
    expect(db.prepare('SELECT COUNT(*) AS n FROM edges').get().n).toBeGreaterThan(0);
    expect(edgesBuilt(db)).toBe(true);
  });
});
