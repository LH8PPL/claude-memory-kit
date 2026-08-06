// @doors: 1, 2
// Door 3 N/A: in-process; no subprocess spawn (better-sqlite3 FFI).
// Door 4 N/A: no message-queue interaction.
// Door 5 N/A: search.mjs doesn't emit NDJSON logs; query stats are returned in the result struct, not logged.

// Tests for Task 30 — `cmk search` hybrid CLI (T-026).
// Per tasks.md 30.5:
//   - Test keyword on 10k-observation fixture: results in <100 ms
//   - Test `--mode semantic` without a prepared backend: exit 2 / schema error with the actionable hint (Task 65 updated the wording)
//   - Test `--mode hybrid` with both mocked: reciprocal-rank fusion (0.5/0.5)
//   - Test `--min-trust medium` excludes low-trust results
//   - Test `--tier P` excludes user/local results
//   - Test `--since 2026-05-01` excludes older observations
//   - Test tombstoned excluded by default; included with `--include-tombstoned`

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import {
  search,
  countKeywordMatches,
  reciprocalRankFusion,
  prepareFtsQuery,
  SEARCH_MODES,
} from '../packages/cli/src/search.mjs';
import { openIndexDb } from '../packages/cli/src/index-db.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { reindexFull } from '../packages/cli/src/index-rebuild.mjs';
import { writeBullet } from '../packages/cli/src/provenance.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');
const CMK_BIN = join(REPO_ROOT, 'packages', 'cli', 'bin', 'cmk.mjs');

let sandbox;
let dbPath;
let db;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-search-test-'));
  dbPath = join(sandbox, 'memory.db');
  db = openIndexDb({ projectRoot: sandbox, dbPath });
});

afterEach(() => {
  db?.close();
  rmSync(sandbox, { recursive: true, force: true });
});

// Helper: seed N observations directly into the DB. Bypasses
// reindex.mjs to keep this test focused on search semantics — Task 29
// already covers the markdown → DB path. Tests here verify SQL +
// FTS5 query behavior independently.
function seedObservation(db, {
  id, body, tier = 'P', trust = 'high',
  heading_path = 'MEMORY.md > Active Threads',
  write_source = 'user-explicit',
  source_file = 'MEMORY.md',
  source_line = 1,
  created_at = Date.parse('2026-05-27T10:00:00Z'),
  deleted_at = null,
  expires_at = null,
}) {
  db.prepare(`
    INSERT INTO observations
      (id, tier, source_file, source_line, source_sha1, heading_path, body,
       write_source, trust, created_at, superseded_by, deleted_at, expires_at)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, tier, source_file, source_line, 'a'.repeat(40), heading_path, body,
    write_source, trust, created_at, null, deleted_at, expires_at,
  );
}

describe('Task 30 — cmk search', () => {
  describe('Keyword backend (FTS5 BM25)', () => {
    it('returns hits matching the query', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'we standardized on pnpm for new projects' });
      seedObservation(db, { id: 'P-BBBBBBBB', body: 'rust is the right tool for hot loops' });
      const r = search({ db, query: 'pnpm' });
      expect(r.action).toBe('found');
      expect(r.mode).toBe('keyword');
      expect(r.results).toHaveLength(1);
      expect(r.results[0].id).toBe('P-AAAAAAAA');
      expect(r.results[0].snippet).toContain('pnpm');
    });

    // 30.5 #1: keyword on 10k-observation fixture: results in <100 ms.
    // The kit's design §9.3 target — meaningful for the search UX
    // to feel "instant" inside Claude Code.
    it('30.5 #1 — keyword query over 10k observations completes in <500ms', () => {
      // 10000 observations with varied bodies. Use a deterministic
      // generator so timing is reproducible.
      const insert = db.prepare(`
        INSERT INTO observations
          (id, tier, source_file, source_line, source_sha1, heading_path, body,
           write_source, trust, created_at, superseded_by, deleted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      // Test IDs use the kit's base32 alphabet (excludes 0/O/1/l/I/8).
      // We generate `P-[2-9A-Za]{8}` shapes that always pass validate-test-ids.
      // Kit's base32 alphabet excludes `0/O/1/l/I/8` — the 8 was incorrectly
      // included in an earlier draft, leaving ~5.9% of generated IDs failing
      // ID_PATTERN at runtime (silent because validate-test-ids runs against
      // literals, not generated IDs). Surfaced as Minor M1 by Task 30 review.
      const ALPHA = '2345679ABCDEFGHJKLMNPQRSTUVWXYZa';
      const insertMany = db.transaction((n) => {
        for (let i = 0; i < n; i++) {
          let id = 'P-';
          let x = i;
          for (let k = 0; k < 8; k++) {
            id += ALPHA[(x + k * 7) % ALPHA.length];
            x = Math.floor(x / ALPHA.length);
          }
          const body = `observation #${i}: ${i % 17 === 0 ? 'pnpm wins' : 'placeholder text'}`;
          insert.run(
            id, 'P', 'MEMORY.md', 1, 'a'.repeat(40),
            'MEMORY.md > Active Threads', body, 'user-explicit', 'high',
            // Production stores created_at as epoch MILLISECONDS (per
            // index-rebuild.mjs's isoToEpochMs). Use Date.parse() base
            // + offset so the test fixture matches production
            // semantics; an earlier draft used epoch seconds which
            // would have silently broken any future test that adds a
            // --since filter. M4 from Task 30 review.
            Date.parse('2026-05-27T10:00:00Z') + i, null, null,
          );
        }
      });
      insertMany(10000);
      const t0 = Date.now();
      const r = search({ db, query: 'pnpm', limit: 50 });
      const elapsed = Date.now() - t0;
      expect(r.action).toBe('found');
      expect(r.results.length).toBeGreaterThan(0);
      // Design §9.3 target is 100ms; 500ms is a generous CI ceiling
      // (the kit's typical query on a 10k corpus completes in tens
      // of ms locally). If this fails, FTS5 isn't being used or the
      // BM25 index is corrupted.
      expect(elapsed).toBeLessThan(500);
    });

    it('30.5 #4 — --min-trust medium excludes low-trust results', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'high trust pnpm fact', trust: 'high' });
      seedObservation(db, { id: 'P-BBBBBBBB', body: 'medium trust pnpm fact', trust: 'medium' });
      seedObservation(db, { id: 'P-CCCCCCCC', body: 'low trust pnpm fact', trust: 'low' });
      const r = search({ db, query: 'pnpm', minTrust: 'medium' });
      expect(r.action).toBe('found');
      const trusts = r.results.map((x) => x.trust).sort();
      expect(trusts).toEqual(['high', 'medium']); // low excluded
    });

    it('30.5 #5 — --tier P excludes user/local results', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'project tier pnpm', tier: 'P' });
      seedObservation(db, { id: 'U-BBBBBBBB', body: 'user tier pnpm', tier: 'U' });
      seedObservation(db, { id: 'L-CCCCCCCC', body: 'local tier pnpm', tier: 'L' });
      const r = search({ db, query: 'pnpm', tier: 'P' });
      const tiers = r.results.map((x) => x.tier);
      expect(tiers).toEqual(['P']);
    });

    it('30.5 #6 — --since 2026-05-01 excludes older observations', () => {
      seedObservation(db, {
        id: 'P-AAAAAAAA',
        body: 'old fact about pnpm',
        created_at: Date.parse('2026-04-01T10:00:00Z'),
      });
      seedObservation(db, {
        id: 'P-BBBBBBBB',
        body: 'new fact about pnpm',
        created_at: Date.parse('2026-05-15T10:00:00Z'),
      });
      const r = search({ db, query: 'pnpm', since: '2026-05-01T00:00:00Z' });
      expect(r.results.map((x) => x.id)).toEqual(['P-BBBBBBBB']);
    });

    it('30.5 #7 — tombstoned excluded by default; included with --include-tombstoned', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'live pnpm fact' });
      seedObservation(db, {
        id: 'P-BBBBBBBB',
        body: 'deleted pnpm fact',
        deleted_at: Date.parse('2026-05-20T10:00:00Z'),
      });
      const rDefault = search({ db, query: 'pnpm' });
      expect(rDefault.results.map((x) => x.id)).toEqual(['P-AAAAAAAA']);
      const rWithTombstones = search({ db, query: 'pnpm', includeTombstoned: true });
      expect(rWithTombstones.results.map((x) => x.id).sort()).toEqual(
        ['P-AAAAAAAA', 'P-BBBBBBBB'],
      );
    });

    it('Task 66.3 — expired facts hidden by default; includeExpired reveals (mem0 show_expired parity)', () => {
      const now = '2026-07-02T12:00:00Z';
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'live pnpm fact (no expiry)' });
      seedObservation(db, {
        id: 'P-BBBBBBBB',
        body: 'expired pnpm fact',
        expires_at: Date.parse('2026-07-01T00:00:00Z'),
      });
      seedObservation(db, {
        id: 'P-CCCCCCCC',
        body: 'future-expiry pnpm fact still valid',
        expires_at: Date.parse('2026-12-31T00:00:00Z'),
      });
      const rDefault = search({ db, query: 'pnpm', now });
      expect(rDefault.results.map((x) => x.id).sort()).toEqual(
        ['P-AAAAAAAA', 'P-CCCCCCCC'],
      );
      const rAll = search({ db, query: 'pnpm', now, includeExpired: true });
      expect(rAll.results.map((x) => x.id).sort()).toEqual(
        ['P-AAAAAAAA', 'P-BBBBBBBB', 'P-CCCCCCCC'],
      );
    });

    it('Task 66.3 — expiry boundary is exclusive-end: expires_at == now is already expired', () => {
      const now = '2026-07-02T12:00:00Z';
      seedObservation(db, {
        id: 'P-DDDDDDDD',
        body: 'boundary pnpm fact',
        expires_at: Date.parse(now),
      });
      const r = search({ db, query: 'pnpm', now });
      expect(r.results).toHaveLength(0);
    });

    it('returns no-results structure for a query with no matches', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'unrelated content' });
      const r = search({ db, query: 'pnpm' });
      expect(r.action).toBe('found');
      expect(r.results).toHaveLength(0);
    });

    it('honors --limit', () => {
      // Generate 30 unique IDs via base-32 encoding over the kit alphabet
      // (no 0/O/1/l/I/8). Previous hand-rolled char-cycling collided
      // every 26 iterations.
      // Kit's base32 alphabet excludes `0/O/1/l/I/8` — the 8 was incorrectly
      // included in an earlier draft, leaving ~5.9% of generated IDs failing
      // ID_PATTERN at runtime (silent because validate-test-ids runs against
      // literals, not generated IDs). Surfaced as Minor M1 by Task 30 review.
      const ALPHA = '2345679ABCDEFGHJKLMNPQRSTUVWXYZa';
      function uniqueId(i) {
        let x = i;
        let suffix = '';
        for (let k = 0; k < 8; k++) {
          suffix += ALPHA[x % ALPHA.length];
          x = Math.floor(x / ALPHA.length);
        }
        return 'P-' + suffix;
      }
      for (let i = 0; i < 30; i++) {
        seedObservation(db, {
          id: uniqueId(i),
          body: `pnpm hit number ${i}`,
        });
      }
      const r = search({ db, query: 'pnpm', limit: 7 });
      expect(r.results.length).toBe(7);
    });
  });

  describe('Semantic backend (Layer 5b — not in v0.1.0)', () => {
    it('30.5 #2 — --mode semantic without backend: exit-2 surface (semantic_unavailable)', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'pnpm fact' });
      const r = search({ db, query: 'pnpm', mode: 'semantic' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('semantic_unavailable');
      expect(r.errors[0]).toMatch(/no semantic backend provided/);
    });

    it('semantic mode with injected backend returns its results', () => {
      // The enrich step (Task 227) looks the row up in observations — a
      // semantic hit always corresponds to a real indexed fact.
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'pnpm fact' });
      const fakeSemantic = () => [
        { id: 'P-AAAAAAAA', snippet: 'semantic hit', source_file: 'MEMORY.md', source_line: 1, tier: 'P', trust: 'high', score: 0.95 },
      ];
      const r = search({
        db,
        query: 'pnpm',
        mode: 'semantic',
        semanticBackend: fakeSemantic,
      });
      expect(r.action).toBe('found');
      expect(r.mode).toBe('semantic');
      // Task 227 (D-358): semantic/hybrid rows gain the citation fields via
      // the post-mode enrich step — date (from the observation's created_at)
      // + heading (its heading_path). The backend's own fields pass through
      // unchanged; the enrichment is additive.
      expect(r.results).toEqual([
        {
          id: 'P-AAAAAAAA', snippet: 'semantic hit', source_file: 'MEMORY.md', source_line: 1,
          tier: 'P', trust: 'high', score: 0.95,
          date: '2026-05-27', heading: 'MEMORY.md > Active Threads',
        },
      ]);
    });
  });

  describe('Hybrid mode (30.5 #3)', () => {
    it('--mode hybrid without semantic backend: exit-2 surface', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'pnpm fact' });
      const r = search({ db, query: 'pnpm', mode: 'hybrid' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('semantic_unavailable');
    });

    it('--mode hybrid with both mocked: reciprocal-rank fusion (0.5/0.5)', () => {
      // Seed keyword index with two facts.
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'top keyword pnpm hit' });
      seedObservation(db, { id: 'P-BBBBBBBB', body: 'second keyword pnpm hit' });
      // Mock semantic returns the SAME facts in reversed order — so the
      // RRF should boost the doc that appears top-in-one + second-in-other
      // over the docs that appear in only one ranking.
      const fakeSemantic = () => [
        { id: 'P-BBBBBBBB', snippet: 'semantic boost', source_file: 'MEMORY.md', source_line: 1, tier: 'P', trust: 'high', score: 0.9 },
        { id: 'P-AAAAAAAA', snippet: 'semantic third', source_file: 'MEMORY.md', source_line: 1, tier: 'P', trust: 'high', score: 0.8 },
      ];
      const r = search({
        db,
        query: 'pnpm',
        mode: 'hybrid',
        semanticBackend: fakeSemantic,
      });
      expect(r.action).toBe('found');
      expect(r.mode).toBe('hybrid');
      expect(r.results.length).toBe(2);
      // Both IDs present (RRF doesn't drop docs that appear in only one backend).
      const ids = r.results.map((x) => x.id).sort();
      expect(ids).toEqual(['P-AAAAAAAA', 'P-BBBBBBBB']);
    });
  });

  describe('reciprocalRankFusion (pure-function unit)', () => {
    it('fuses two rankings; docs in both backends score higher than docs in one', () => {
      const a = { id: 'P-AAAAAAAA', snippet: 'a' };
      const b = { id: 'P-BBBBBBBB', snippet: 'b' };
      const c = { id: 'P-CCCCCCCC', snippet: 'c' };
      const fused = reciprocalRankFusion({
        keywordResults: [a, b, c],
        semanticResults: [a, c], // b only in keyword
      });
      // a is rank-1 in both → highest fused score
      expect(fused[0].id).toBe('P-AAAAAAAA');
      // c is rank-3 in keyword + rank-2 in semantic → higher than b (rank-2 in keyword, missing from semantic)
      const cScore = fused.find((x) => x.id === 'P-CCCCCCCC').score;
      const bScore = fused.find((x) => x.id === 'P-BBBBBBBB').score;
      expect(cScore).toBeGreaterThan(bScore);
    });

    it('0.5/0.5 weight (default) symmetrically combines rankings', () => {
      const a = { id: 'P-AAAAAAAA', snippet: 'a' };
      const b = { id: 'P-BBBBBBBB', snippet: 'b' };
      // a is rank-1 keyword, rank-2 semantic; b is rank-2 keyword, rank-1 semantic.
      // With 0.5/0.5 weights, both should fuse to identical scores.
      const fused = reciprocalRankFusion({
        keywordResults: [a, b],
        semanticResults: [b, a],
      });
      expect(fused[0].score).toBe(fused[1].score);
    });
  });

  // Task 153 — query sanitization. Before this task, queries containing
  // FTS5-special chars (`.`, `-`, `:`) or bare reserved words crashed with
  // a schema error and a "wrap in quotes" hint the user had to act on. Now
  // prepareFtsQuery auto-quotes the offending tokens (the SQLite-sanctioned
  // escape, per the FTS5 spec §3 + basic-memory's implementation), so a
  // natural query like `v0.3` just finds results. The old error-asserting
  // tests below were INVERTED to assert success — a justified test change:
  // the new behavior is strictly better (recall "just works"), not a
  // test-edited-to-pass-broken-code change. See
  // docs/research/2026-06-15-fts5-query-preparation-cross-system.md.
  describe('FTS5 query sanitization (Task 153)', () => {
    it('version string with a dot → finds results, no crash (the reported bug)', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'v0.3 release shipped to npm' });
      seedObservation(db, { id: 'P-BBBBBBBB', body: 'unrelated note about rust' });
      const r = search({ db, query: 'v0.3' });
      expect(r.action).toBe('found');
      expect(r.results).toHaveLength(1);
      expect(r.results[0].id).toBe('P-AAAAAAAA');
    });

    it('multi-token query containing a version string → finds results', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'the v0.3 queue has remaining tasks to ship' });
      // The exact shape that crashed in the live session:
      // "v0.3 queue remaining tasks ship".
      const r = search({ db, query: 'v0.3 queue remaining tasks ship' });
      expect(r.action).toBe('found');
      expect(r.results.map((x) => x.id)).toContain('P-AAAAAAAA');
    });

    it('hyphenated query (the kit write_source enum) → finds results', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'this fact has user-explicit provenance', write_source: 'user-explicit' });
      const r = search({ db, query: 'user-explicit' });
      expect(r.action).toBe('found');
      expect(r.results[0].id).toBe('P-AAAAAAAA');
    });

    it('colon-containing query → finds results (no unknown-column crash)', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'design section nine three covers search' });
      const r = search({ db, query: 'section:search' });
      // The `:` no longer crashes; quoted, it tokenizes to section + search.
      expect(r.action).toBe('found');
    });

    it('bare reserved word (AND) → literal search, no crash', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'rock AND roll all night' });
      const r = search({ db, query: 'AND' });
      // Quoted "AND" is a valid literal token, not the boolean operator.
      expect(r.action).toBe('found');
    });

    it('plain multi-word query keeps implicit-AND semantics (recall not narrowed)', () => {
      // Both words appear in A but spread apart (not adjacent); B has only one.
      // Distinct stems on purpose — the FTS schema uses `porter` stemming, so
      // the excluded doc must not share a stem with either query word.
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'kubernetes runs here and elephants graze nearby' });
      seedObservation(db, { id: 'P-BBBBBBBB', body: 'kubernetes runs here with no large animals at all' });
      // Per-token (not whole-query-phrase) quoting: the two words are AND'd,
      // not required to be adjacent — A has both kubernetes + elephant(s),
      // B has kubernetes but not elephant. A whole-query phrase wrap would
      // have required adjacency and wrongly dropped A too.
      const r = search({ db, query: 'kubernetes elephants' });
      expect(r.action).toBe('found');
      expect(r.results.map((x) => x.id)).toContain('P-AAAAAAAA');
      expect(r.results.map((x) => x.id)).not.toContain('P-BBBBBBBB');
    });

    it('an already-quoted phrase is preserved (power-user phrase search still works)', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'thin routes service repository layered' });
      seedObservation(db, { id: 'P-BBBBBBBB', body: 'routes and thin words far apart not adjacent' });
      const r = search({ db, query: '"thin routes"' });
      expect(r.action).toBe('found');
      // The phrase requires adjacency: only P-AAAAAAAA has "thin routes" together.
      expect(r.results.map((x) => x.id)).toContain('P-AAAAAAAA');
      expect(r.results.map((x) => x.id)).not.toContain('P-BBBBBBBB');
    });
  });

  // Direct unit tests of the pure prepareFtsQuery helper (boundary test —
  // it's exported for isolated verification like reciprocalRankFusion).
  describe('prepareFtsQuery (Task 153 — pure helper)', () => {
    it('passes a plain bareword through untouched', () => {
      expect(prepareFtsQuery('pnpm')).toBe('pnpm');
    });

    it('leaves a plain multi-word query as implicit-AND barewords', () => {
      expect(prepareFtsQuery('layered architecture')).toBe('layered architecture');
    });

    it('quotes a token containing a dot', () => {
      expect(prepareFtsQuery('v0.3')).toBe('"v0.3"');
    });

    it('quotes only the special token in a mixed query', () => {
      expect(prepareFtsQuery('ship v0.3 now')).toBe('ship "v0.3" now');
    });

    it('quotes a hyphenated token', () => {
      expect(prepareFtsQuery('user-explicit')).toBe('"user-explicit"');
    });

    it('quotes a bare reserved word so it is literal', () => {
      expect(prepareFtsQuery('AND')).toBe('"AND"');
    });

    it('preserves an already-quoted phrase verbatim', () => {
      expect(prepareFtsQuery('"thin routes"')).toBe('"thin routes"');
    });

    it('escapes an embedded double quote by doubling it', () => {
      // FTS5 escapes a literal " inside a quoted string SQL-style (""),
      // per sqlite.org/fts5 §3. A token like he"llo must not break out.
      expect(prepareFtsQuery('he"llo')).toBe('"he""llo"');
    });

    it('returns an empty string for empty/whitespace input', () => {
      expect(prepareFtsQuery('')).toBe('');
      expect(prepareFtsQuery('   ')).toBe('');
    });
  });

  describe('CLI integration (I2 — tasks.md 30.5 #2 exit-2 contract)', () => {
    it('`cmk search --mode semantic` without the optional embedder available still exits 2 with a clear message', async () => {
      // Spawn the actual `cmk` binary. The semantic-unavailable path in
      // runSearch sets process.exitCode = 2; this test verifies the
      // process-exit contract that tasks.md 30.5 #2 explicitly
      // demands: "exit 2; stderr says the semantic backend is unavailable".
      // The in-process search() unit tests pin the return-shape; this
      // one pins the CLI's stderr + exit code.
      const sandbox = mkdtempSync(join(tmpdir(), 'cmk-search-cli-'));
      const projectRoot = join(sandbox, 'proj');
      const userDir = join(sandbox, 'user');
      try {
        await install({ projectRoot, userTier: userDir });
        const r = spawnSync(
          process.execPath,
          [CMK_BIN, 'search', 'pnpm', '--mode', 'semantic'],
          {
            cwd: projectRoot,
            encoding: 'utf8',
            // Deterministic unavailability: the dev/CI env HAS the optional
            // embedder installed, so force the disabled path (the same
            // ok:false branch an uninstalled embedder takes).
            env: { ...process.env, CMK_DISABLE_SEMANTIC: '1' },
          },
        );
        expect(r.status).toBe(2);
        expect((r.stderr || '') + (r.stdout || '')).toMatch(/semantic backend unavailable|disabled-by-env|embedder/i);
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    });
  });

  describe('Integration: reindex + search (I3 — CLAUDE.md cross-module rule)', () => {
    it('reindexFull populates an index that search can query end-to-end', async () => {
      // Per CLAUDE.md "Integration-test coverage for cross-module flows
      // (binding)": Task 29's reindex and Task 30's search compose at
      // runtime; this test exercises the full path with no mocks of
      // either inner module. Catches the failure class where the
      // columns reindex writes (body, heading_path, write_source) drift
      // from what search expects.
      const sandbox = mkdtempSync(join(tmpdir(), 'cmk-search-integ-'));
      const projectRoot = join(sandbox, 'proj');
      const userDir = join(sandbox, 'user');
      try {
        await install({ projectRoot, userTier: userDir });
        // Seed MEMORY.md with two bullets via the canonical provenance
        // writer.
        const r1 = writeBullet({
          id: 'P-AAAAAAAA',
          text: 'standardized on pnpm for new node projects',
          provenance: {
            source: 'MEMORY.md', source_line: 5,
            sha1: 'b'.repeat(40), write: 'user-explicit',
            trust: 'high', at: '2026-05-27T10:00:00Z',
          },
        });
        const r2 = writeBullet({
          id: 'P-BBBBBBBB',
          text: 'rust is the right tool for hot loops',
          provenance: {
            source: 'MEMORY.md', source_line: 7,
            sha1: 'b'.repeat(40), write: 'user-explicit',
            trust: 'high', at: '2026-05-27T10:00:00Z',
          },
        });
        writeFileSync(
          join(projectRoot, 'context', 'MEMORY.md'),
          ['# MEMORY.md', '', '## Active Threads', '', r1.bullet, r1.comment, r2.bullet, r2.comment, ''].join('\n'),
          'utf8',
        );
        // Open the index DB + run a full reindex.
        const indexDb = openIndexDb({ projectRoot });
        try {
          reindexFull({ projectRoot, userDir, db: indexDb });
          // Now search via the same DB handle.
          const r = search({ db: indexDb, query: 'pnpm' });
          expect(r.action).toBe('found');
          expect(r.results).toHaveLength(1);
          expect(r.results[0].id).toBe('P-AAAAAAAA');
          expect(r.results[0].snippet).toContain('pnpm');
          // heading_path from MEMORY.md → 'MEMORY.md > Active Threads'
          // proves the reindex correctly populated the column search
          // queries against.
        } finally {
          indexDb.close();
        }
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    });

    it('Task 66.3 end-to-end: a fact FILE with expires_at indexes to epoch ms and search hides it once past (writeFact → reindexFull → search)', async () => {
      const sandbox = mkdtempSync(join(tmpdir(), 'cmk-search-expiry-e2e-'));
      const projectRoot = join(sandbox, 'proj');
      const userDir = join(sandbox, 'user');
      try {
        await install({ projectRoot, userTier: userDir });
        const live = writeFact({
          tier: 'P', type: 'project', slug: 'live-fact',
          title: 'Live fact', body: 'the zebra deployment target is Cloud Run',
          writeSource: 'user-explicit', trust: 'high',
          sourceFile: 'context/transcripts/2026-07-01.md', sourceLine: 1,
          sourceSha1: 'd'.repeat(40), projectRoot,
        });
        const expired = writeFact({
          tier: 'P', type: 'project', slug: 'expired-fact',
          title: 'Expired fact', body: 'the zebra demo is scheduled for last Friday',
          writeSource: 'user-explicit', trust: 'high',
          sourceFile: 'context/transcripts/2026-06-20.md', sourceLine: 1,
          sourceSha1: 'e'.repeat(40), expiresAt: '2026-06-27', projectRoot,
        });
        expect(live.action).toBe('created');
        expect(expired.action).toBe('created');
        const indexDb = openIndexDb({ projectRoot });
        try {
          reindexFull({ projectRoot, userDir, db: indexDb });
          const r = search({ db: indexDb, query: 'zebra', now: '2026-07-02T12:00:00Z' });
          expect(r.results.map((x) => x.id)).toEqual([live.id]);
          const rAll = search({
            db: indexDb, query: 'zebra', now: '2026-07-02T12:00:00Z', includeExpired: true,
          });
          expect(rAll.results.map((x) => x.id).sort()).toEqual([live.id, expired.id].sort());
        } finally {
          indexDb.close();
        }
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    });

    it('cmk search auto-reindexes — finds a fact with NO manual reindex (#0, fresh install)', async () => {
      // Self-test finding #0 (2026-05-30): on a fresh install the FTS5 index
      // is never built — runSearch did openIndexDb → searchAction with no
      // reindex, and the runtime chokidar watcher isn't running for a
      // one-shot CLI call. So `cmk search` returned "no results" even though
      // the fact was sitting in MEMORY.md (it only worked after a manual
      // `cmk reindex --full`). runSearch must reindexBoot before querying.
      // This spawns the REAL cmk bin (Door 3) with NO prior reindex — the
      // exact user-reported path.
      const sandbox = mkdtempSync(join(tmpdir(), 'cmk-search-autoreindex-'));
      const projectRoot = join(sandbox, 'proj');
      const userDir = join(sandbox, 'user');
      try {
        await install({ projectRoot, userTier: userDir });
        const r1 = writeBullet({
          id: 'P-AAAAAAAA',
          text: 'standardized on pnpm for new node projects',
          provenance: {
            source: 'MEMORY.md', source_line: 5,
            sha1: 'c'.repeat(40), write: 'user-explicit',
            trust: 'high', at: '2026-05-27T10:00:00Z',
          },
        });
        writeFileSync(
          join(projectRoot, 'context', 'MEMORY.md'),
          ['# MEMORY.md', '', '## Active Threads', '', r1.bullet, r1.comment, ''].join('\n'),
          'utf8',
        );
        // NO manual reindex. Spawn the real binary exactly as a user would.
        const r = spawnSync(
          process.execPath,
          [CMK_BIN, 'search', 'pnpm'],
          {
            cwd: projectRoot,
            encoding: 'utf8',
            env: { ...process.env, MEMORY_KIT_USER_DIR: userDir },
          },
        );
        expect(r.status ?? 0).toBe(0);
        expect(r.stdout).toContain('P-AAAAAAAA');
        expect(r.stdout).toContain('pnpm');
        expect(r.stdout).not.toContain('no results');
      } finally {
        rmSync(sandbox, { recursive: true, force: true });
      }
    });
  });

  describe('Schema-error validation', () => {
    it('rejects empty query', () => {
      const r = search({ db, query: '' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects invalid mode', () => {
      const r = search({ db, query: 'pnpm', mode: 'wat' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects invalid tier', () => {
      const r = search({ db, query: 'pnpm', tier: 'Z' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects invalid minTrust', () => {
      const r = search({ db, query: 'pnpm', minTrust: 'wat' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects invalid since', () => {
      const r = search({ db, query: 'pnpm', since: 'not-an-iso-date' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects non-positive limit', () => {
      const r = search({ db, query: 'pnpm', limit: 0 });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });
  });

  // Task 104.2 — the L3 raw tier: scope='transcripts' searches the SEPARATE
  // transcript_chunks index; the default scope ('facts') never touches it
  // (the MemPalace last-resort contract — raw chunks must not pollute L1).
  describe("scope='transcripts' (Task 104.2 — the L3 raw tier)", () => {
    const seedChunk = (db, { file, idx = 0, line = 1, heading = '## 2026-06-10T10:00:00Z — assistant', body }) =>
      db
        .prepare(
          'INSERT INTO transcript_chunks (source_file, chunk_idx, source_line, heading, body) VALUES (?, ?, ?, ?, ?)',
        )
        .run(file, idx, line, heading, body);

    it('keyword search over transcript chunks: synthetic T: ids, no tier/trust', () => {
      seedChunk(db, {
        file: 'context/transcripts/2026-06-10.md',
        line: 7,
        body: 'We debugged the ECONNRESET by pinning the agent to one socket.',
      });
      const r = search({ db, query: 'ECONNRESET', scope: 'transcripts' });
      expect(r.action).toBe('found');
      expect(r.results).toHaveLength(1);
      const hit = r.results[0];
      expect(hit.id).toBe('T:context/transcripts/2026-06-10.md:7');
      expect(hit.source_file).toBe('context/transcripts/2026-06-10.md');
      expect(hit.source_line).toBe(7);
      expect(hit.snippet).toContain('ECONNRESET');
      expect(hit.tier).toBeUndefined();
      expect(hit.trust).toBeUndefined();
    });

    it('the DEFAULT scope never returns transcript chunks (L1 stays curated)', () => {
      seedObservation(db, { id: 'P-AAAAAAAA', body: 'a curated fact about sockets' });
      seedChunk(db, {
        file: 'context/transcripts/2026-06-10.md',
        body: 'raw transcript noise about sockets and sockets and sockets',
      });
      const r = search({ db, query: 'sockets' });
      expect(r.action).toBe('found');
      expect(r.results).toHaveLength(1);
      expect(r.results[0].id).toBe('P-AAAAAAAA');
    });

    it('rejects fact-only filters under the transcripts scope (chunks carry no tier/trust/created_at)', () => {
      for (const opts of [{ tier: 'P' }, { minTrust: 'high' }, { since: '2026-06-01T00:00:00Z' }]) {
        const r = search({ db, query: 'x', scope: 'transcripts', ...opts });
        expect(r.action).toBe('error');
        expect(r.errorCategory).toBe('schema');
        expect(r.errors.join(' ')).toMatch(/transcripts scope/);
      }
    });

    it('rejects an unknown scope', () => {
      const r = search({ db, query: 'x', scope: 'everything' });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('hybrid fusion works over transcript hits (synthetic ids key the RRF)', () => {
      seedChunk(db, {
        file: 'context/transcripts/2026-06-10.md',
        line: 3,
        body: 'the deploy target discussion happened here',
      });
      const fakeSemantic = () => [
        {
          id: 'T:context/transcripts/2026-06-10.md:3',
          snippet: 'the deploy target discussion happened here',
          source_file: 'context/transcripts/2026-06-10.md',
          source_line: 3,
          score: 0.9,
        },
      ];
      const r = search({
        db,
        query: 'deploy target',
        scope: 'transcripts',
        mode: 'hybrid',
        semanticBackend: fakeSemantic,
      });
      expect(r.action).toBe('found');
      expect(r.results).toHaveLength(1); // fused into ONE hit, not duplicated
      expect(r.results[0].id).toBe('T:context/transcripts/2026-06-10.md:3');
    });
  });

  // Task 156 (D-168) — scope='decisions' scans context/DECISIONS.md (the
  // append-only decision journal). The journal is deliberately NOT FTS-indexed
  // (derived view, skipped like INDEX.md), so this scope reads the file directly
  // — the recall path for decision-HISTORY / "what did we reject" queries the
  // flat fact store can't answer. Mirrors the transcripts-scope precedent (a
  // separate derived corpus reached through the existing search verb).
  describe("scope='decisions' (Task 156 — the decision journal)", () => {
    // A realistic journal: two live decisions + one RETRACTED (the "what did we
    // reject" trail the live fact store no longer carries).
    // The REAL on-disk format the writer (decisions-journal.mjs buildDecisionEntry)
    // emits since Task 164.1: `## ` entry headings (h2, MD001) with a blank line
    // around each heading (MD022). The retract tag sits on its OWN line DIRECTLY
    // under the heading (the inserter puts it at headingEnd+1). This fixture
    // matches production output byte-shape — NOT the stale `### ` form the old
    // fixture used (which made the search.mjs:487 retraction reader pass on the
    // wrong format — the 164.3 bug).
    const JOURNAL = [
      '# Decisions',
      '',
      '> Append-only decision journal — every decision the kit captured, in order, with its why.',
      '',
      '<!-- decision:P-AAAAAAAA -->',
      '',
      '## Use Postgres for the primary store',
      '',
      '**When:** 2026-03-01 · **Fact:** `P-AAAAAAAA`',
      '**Why:** team familiarity + JSONB support',
      '',
      '<!-- decision:P-BBBBBBBB -->',
      '',
      '## Switch the primary store to SQLite',
      '_(retracted 2026-05-01)_',
      '',
      '**When:** 2026-05-01 · **Fact:** `P-BBBBBBBB`',
      '**Why:** single-file portability won out over Postgres ops cost',
      '',
      '<!-- decision:P-CCCCCCCC -->',
      '',
      '## Adopt hybrid RRF search at k=60',
      '',
      '**When:** 2026-06-01 · **Fact:** `P-CCCCCCCC`',
      '**Why:** keyword alone missed paraphrases; k=60 is the IR default',
    ].join('\n');

    function seedJournal(content = JOURNAL) {
      mkdirSync(join(sandbox, 'context'), { recursive: true });
      writeFileSync(join(sandbox, 'context', 'DECISIONS.md'), content, 'utf8');
    }

    it('keyword search over the journal: returns matching entries with their fact ids', () => {
      seedJournal();
      const r = search({ db, projectRoot: sandbox, query: 'SQLite', scope: 'decisions' });
      expect(r.action).toBe('found');
      expect(r.scope).toBe('decisions');
      expect(r.results).toHaveLength(1);
      const hit = r.results[0];
      expect(hit.id).toBe('P-BBBBBBBB');
      expect(hit.source_file).toBe('context/DECISIONS.md');
      expect(hit.snippet).toContain('SQLite');
    });

    it('surfaces a RETRACTED entry (the "what did we reject" trail) WITH its retraction marker', () => {
      seedJournal();
      // The Postgres→SQLite supersede: querying the topic must surface the
      // retracted decision, marked, so recall can answer "did this change?".
      const r = search({ db, projectRoot: sandbox, query: 'store', scope: 'decisions' });
      expect(r.action).toBe('found');
      const retracted = r.results.find((x) => x.id === 'P-BBBBBBBB');
      expect(retracted).toBeDefined();
      expect(retracted.retracted).toBe(true);
      expect(retracted.snippet).toMatch(/retracted/);
    });

    it('multiple matches come back (history axis — not collapsed to one)', () => {
      seedJournal();
      const r = search({ db, projectRoot: sandbox, query: 'store', scope: 'decisions' });
      // Both the Postgres and the SQLite store decisions mention "store".
      expect(r.results.map((x) => x.id).sort()).toEqual(['P-AAAAAAAA', 'P-BBBBBBBB']);
    });

    it('the DEFAULT (facts) scope never reads the journal', () => {
      seedJournal();
      seedObservation(db, { id: 'P-DDDDDDDD', body: 'a curated fact about Postgres' });
      const r = search({ db, projectRoot: sandbox, query: 'Postgres' });
      expect(r.results).toHaveLength(1);
      expect(r.results[0].id).toBe('P-DDDDDDDD'); // the fact, not the journal entry
    });

    it('does NOT match the literal word "decision" via the marker plumbing (self-review false-positive)', () => {
      seedJournal();
      // The query "decision" appears in EVERY entry's `<!-- decision:ID -->`
      // marker — but matching must run on the cleaned signal (title/When/Why),
      // so a topic word that only occurs in the plumbing returns nothing.
      const r = search({ db, projectRoot: sandbox, query: 'decision', scope: 'decisions' });
      expect(r.action).toBe('found');
      expect(r.results).toEqual([]); // none of the 3 titles/Whys contain "decision"
    });

    it('I1 — an ACTIVE entry whose Why merely mentions "_(retracted" is NOT labelled retracted', () => {
      // skill-review I1: the retract tag sits on its own line under the heading;
      // a Why that discusses retraction must not flip the flag.
      const journal = [
        '# Decisions',
        '',
        '<!-- decision:P-EEEEEEEE -->',
        '',
        '## Keep the old rule in place',
        '',
        '**When:** 2026-06-01 · **Fact:** `P-EEEEEEEE`',
        '**Why:** we considered marking it _(retracted) but decided to keep it active',
      ].join('\n');
      seedJournal(journal);
      const r = search({ db, projectRoot: sandbox, query: 'old rule', scope: 'decisions' });
      expect(r.results).toHaveLength(1);
      expect(r.results[0].id).toBe('P-EEEEEEEE');
      expect(r.results[0].retracted).toBe(false); // active, despite the Why mention
    });

    it('I1 — a genuinely retracted entry (tag on the line under the heading) IS labelled retracted', () => {
      const journal = [
        '# Decisions',
        '',
        '<!-- decision:P-FFFFFFFF -->',
        '',
        '## Reverse the SQLite move',
        '_(retracted 2026-06-05)_',
        '',
        '**When:** 2026-06-01 · **Fact:** `P-FFFFFFFF`',
        '**Why:** went back to the prior store',
      ].join('\n');
      seedJournal(journal);
      const r = search({ db, projectRoot: sandbox, query: 'SQLite', scope: 'decisions' });
      expect(r.results).toHaveLength(1);
      expect(r.results[0].retracted).toBe(true);
    });

    it('I2 — an entry whose Why QUOTES the marker syntax stays ONE entry (no false split)', () => {
      // skill-review I2: a marker mid-line (not at line-start) is body text, not
      // an entry boundary — the writer only ever emits markers at line-start.
      const journal = [
        '# Decisions',
        '',
        '<!-- decision:P-GGGGGGGG -->',
        '',
        '## Journal marker format',
        '',
        '**When:** 2026-06-01 · **Fact:** `P-GGGGGGGG`',
        '**Why:** each entry begins with <!-- decision:P-HHHHHHHH --> as its machine marker',
      ].join('\n');
      seedJournal(journal);
      const r = search({ db, projectRoot: sandbox, query: 'marker format', scope: 'decisions' });
      // ONE real entry (P-GGGGGGGG); the quoted P-HHHHHHHH is NOT a second hit.
      expect(r.results).toHaveLength(1);
      expect(r.results[0].id).toBe('P-GGGGGGGG');
      // And a search that would only match the quoted-marker text still maps to
      // the real entry, never a phantom P-HHHHHHHH entry.
      const r2 = search({ db, projectRoot: sandbox, query: 'machine marker', scope: 'decisions' });
      expect(r2.results.map((x) => x.id)).toEqual(['P-GGGGGGGG']);
    });

    it('empty/missing journal → found with zero results (not an error)', () => {
      // no seedJournal() — context/DECISIONS.md does not exist
      const r = search({ db, projectRoot: sandbox, query: 'anything', scope: 'decisions' });
      expect(r.action).toBe('found');
      expect(r.results).toEqual([]);
    });

    it('rejects fact-only filters under the decisions scope (entries carry no tier/trust/created_at index)', () => {
      seedJournal();
      for (const opts of [{ tier: 'P' }, { minTrust: 'high' }, { since: '2026-06-01T00:00:00Z' }]) {
        const r = search({ db, projectRoot: sandbox, query: 'x', scope: 'decisions', ...opts });
        expect(r.action).toBe('error');
        expect(r.errorCategory).toBe('schema');
        expect(r.errors.join(' ')).toMatch(/decisions scope/);
      }
    });

    it('rejects semantic/hybrid mode under the decisions scope (journal is not embedded)', () => {
      seedJournal();
      const r = search({
        db, projectRoot: sandbox, query: 'x', scope: 'decisions',
        mode: 'semantic', semanticBackend: () => [],
      });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
      expect(r.errors.join(' ')).toMatch(/decisions scope/);
    });
  });

  describe('countKeywordMatches (268/269 — the honest denominator)', () => {
    it('counts the WHOLE match set where search() returns only a page of it', () => {
      // Letters only: the base32 alphabet excludes 0/O/1/l/I/8, and writeFact
      // would happily orphan an id that uses them (Task 270).
      for (const c of ['A', 'B', 'C', 'D', 'E', 'F', 'G']) {
        seedObservation(db, { id: `P-DENAA${c}AA`, body: `denominator probe fact ${c}` });
      }
      const page = search({ db, query: 'denominator', limit: 3 });
      expect(page.results).toHaveLength(3);
      const total = countKeywordMatches({ db, query: 'denominator' });
      expect(total).toBe(7);
      // The invariant the viewer prints: the page is a window onto the count.
      expect(total).toBeGreaterThanOrEqual(page.results.length);
    });

    it('applies the same filters as the page — expired rows are not counted', () => {
      seedObservation(db, { id: 'P-LVEAAAAA', body: 'filtered corpus probe' });
      seedObservation(db, {
        id: 'P-DEADAAAA', body: 'filtered corpus probe',
        expires_at: Date.parse('2026-01-01T00:00:00Z'),
      });
      expect(countKeywordMatches({ db, query: 'filtered corpus' })).toBe(1);
      expect(countKeywordMatches({ db, query: 'filtered corpus', includeExpired: true })).toBe(2);
    });

    // The catch is DEFENSE IN DEPTH: prepareFtsQuery quotes every hostile
    // token shape we could construct, so a grammar error can't be provoked
    // through the public query surface. The contract still matters for other
    // callers: SQLite-level errors wrap as FTS5ParseError (mirroring the
    // identical catch in search()), everything else passes through untouched.
    it('wraps a SQLite-level error as FTS5ParseError — same contract as search()', () => {
      const bare = new Database(':memory:'); // no observations_fts at all
      try {
        expect(() => countKeywordMatches({ db: bare, query: 'anything' }))
          .toThrow(/FTS5|query/i);
        try {
          countKeywordMatches({ db: bare, query: 'anything' });
        } catch (e) {
          expect(e.name).toBe('FTS5ParseError');
        }
      } finally {
        bare.close();
      }
    });

    it('lets a NON-SQLite error pass through unwrapped', () => {
      const boom = new TypeError('not a database at all');
      const fake = { prepare() { throw boom; } };
      try {
        countKeywordMatches({ db: fake, query: 'anything' });
        expect.unreachable('should have thrown');
      } catch (e) {
        expect(e).toBe(boom);
        expect(e.name).toBe('TypeError');
      }
    });
  });
});
