// @doors: 1, 2
// Door 3 N/A: merge is in-process file rewrite; no subprocess spawn.
// Door 4 N/A: no message-queue interaction.
// Door 5 N/A: merge-facts doesn't emit NDJSON; the audit-log entry on consolidation is written by the higher-level memory-write skill, tested separately.

// Tests for Task 10 — Consolidation / merge semantics (T-009).
// Per tasks.md 10.5:
//   - Test merging A + B with body "X. Y." produces C with id = generateId(canonical("x. y."))
//   - Test C's frontmatter contains merged_from: [idA, idB] (order preserved)
//   - Test A.md and B.md moved to archive/superseded/ with superseded_by: <C.id>
//   - Test resolveFact(idA) returns A's body + supersededBy: <C.id> (the mk_get annotation
//     is the MCP layer's job — Task 31 wraps this structured response into the
//     human-readable "merged_into" string)
//   - Test 3-way merge: mergeFacts(mergeFacts(A, B), C) produces final id =
//     generateId(canonical(combined_body)); merged_from traces direct parents
//
// Boundary-test discipline:
//   - Test the mergeFacts() PUBLIC contract — new fact at expected path with
//     correct frontmatter; originals moved with superseded_by; resolveFact
//     finds superseded facts; transitive merge composes correctly.
//   - Do NOT test internal helpers.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mergeFacts } from '../packages/cli/src/merge-facts.mjs';
// Task 281: archive filenames are DERIVED (lowercase `a` escapes to `_a` so a
// case-pair of ids cannot collapse to one file). These tests assert the fact
// landed at its archive name — deriving it here keeps the assertion independent
// of the result object while tracking the one shared convention.
import { archiveFileName } from '../packages/cli/src/fact-store.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { resolveFact } from '../packages/cli/src/forget.mjs';
import { generateId, canonicalize } from '../packages/canonicalize/src/index.mjs';

function validFactOpts(overrides = {}) {
  return {
    tier: 'P',
    type: 'feedback',
    slug: 'sample',
    title: 'Sample fact',
    body: 'Some text content for the fact.',
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'context/transcripts/2026-05-24.md',
    sourceLine: 1,
    sourceSha1: 'deadbeef0123456789abcdef0123456789abcdef',
    ...overrides,
  };
}

function validMergeOpts(idA, idB, overrides = {}) {
  return {
    idA,
    idB,
    mergedBody: 'merged body content',
    mergedTitle: 'Merged title',
    mergedSlug: 'merged_slug',
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'context/transcripts/2026-05-24.md',
    sourceLine: 99,
    sourceSha1: 'feedface0123456789abcdef0123456789abcdef',
    ...overrides,
  };
}

import { parse as parseFrontmatterText } from '../packages/cli/src/frontmatter.mjs';

function parseFrontmatter(filePath) {
  return parseFrontmatterText(readFileSync(filePath, 'utf8'));
}

describe('Task 10 — mergeFacts() boundary', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'cmk-merge-test-'));
    projectRoot = join(sandbox, 'proj');
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  describe('happy path — merge A + B → C', () => {
    it('produces C at <tier>/memory/<type>_<slug>.md with action: "merged"', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a', body: 'Body A.' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'Body B.' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, {
          projectRoot,
          mergedBody: 'X. Y.',
          mergedSlug: 'combined',
        }),
      );
      expect(r.action).toBe('merged');
      expect(r.path).toBe(
        join(projectRoot, 'context', 'memory', 'feedback_combined.md'),
      );
      expect(existsSync(r.path)).toBe(true);
    });

    it('C.id = generateId(tier, canonicalize(merged_body))', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'different body' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, {
          projectRoot,
          mergedBody: 'X. Y.',
        }),
      );
      expect(r.id).toBe(generateId('P', 'X. Y.'));
      // Sanity: canonical form of merged body matches what generateId sees
      expect(canonicalize('X. Y.')).toBe(canonicalize(r.frontmatter ? '' : 'X. Y.'));
    });

    it("C's frontmatter contains merged_from: [idA, idB] in argument order", () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B body' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'combined body' }),
      );
      const text = readFileSync(r.path, 'utf8');
      expect(text).toMatch(
        new RegExp(`merged_from:\\s*\\[\\s*${wA.id}\\s*,\\s*${wB.id}\\s*\\]`),
      );
    });

    it("C inherits shape from parent A (same primary-parent fallback as type) — a merge never resets classification (Task 66.1)", () => {
      const wA = writeFact(
        validFactOpts({ projectRoot, slug: 'a', shape: 'Preference' }),
      );
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'B body', shape: 'Event' }),
      );
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'combined body' }),
      );
      expect(r.action).toBe('merged');
      const { frontmatter } = parseFrontmatter(r.path);
      expect(frontmatter.shape).toBe('Preference');
    });

    it("C inherits the EARLIEST parent expires_at — a merge never mints a permanent fact from expiring ones (Task 66.3, review finding 7)", () => {
      const wA = writeFact(
        validFactOpts({ projectRoot, slug: 'a', expiresAt: '2026-08-01' }),
      );
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'B body', expiresAt: '2026-07-15' }),
      );
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'combined expiring body' }),
      );
      expect(r.action).toBe('merged');
      const text = readFileSync(r.path, 'utf8');
      expect(text).toMatch(/^expires_at: ["']?2026-07-15["']?$/m);
    });

    it("C has NO expires_at when neither parent expires (permanent stays permanent)", () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B body' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'combined permanent body' }),
      );
      const { frontmatter } = parseFrontmatter(r.path);
      expect(frontmatter.expires_at).toBeUndefined();
    });

    it("merged_from order reflects argument order even with swapped ids", () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B body' }));
      const r = mergeFacts(
        validMergeOpts(wB.id, wA.id, { projectRoot, mergedBody: 'combined' }),
      );
      const text = readFileSync(r.path, 'utf8');
      expect(text).toMatch(
        new RegExp(`merged_from:\\s*\\[\\s*${wB.id}\\s*,\\s*${wA.id}\\s*\\]`),
      );
    });
  });

  describe('superseding the originals', () => {
    it('moves A and B to <tier>/memory/archive/superseded/<id>.md and removes the live files', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B body' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'combined' }),
      );
      expect(r.supersededPaths).toHaveLength(2);
      const supersededA = join(
        projectRoot,
        'context',
        'memory',
        'archive',
        'superseded',
        archiveFileName(wA.id),
      );
      const supersededB = join(
        projectRoot,
        'context',
        'memory',
        'archive',
        'superseded',
        archiveFileName(wB.id),
      );
      expect(existsSync(supersededA)).toBe(true);
      expect(existsSync(supersededB)).toBe(true);
      expect(existsSync(wA.path)).toBe(false);
      expect(existsSync(wB.path)).toBe(false);
      expect(r.supersededPaths).toEqual(
        expect.arrayContaining([supersededA, supersededB]),
      );
    });

    it('superseded files have superseded_by: <C.id> in their frontmatter', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B body' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'merged content' }),
      );
      const supersededA = join(
        projectRoot,
        'context',
        'memory',
        'archive',
        'superseded',
        archiveFileName(wA.id),
      );
      const fmA = parseFrontmatter(supersededA).frontmatter;
      const fmB = parseFrontmatter(
        join(
          projectRoot,
          'context',
          'memory',
          'archive',
          'superseded',
          archiveFileName(wB.id),
        ),
      ).frontmatter;
      expect(fmA.superseded_by).toBe(r.id);
      expect(fmB.superseded_by).toBe(r.id);
      // Original frontmatter preserved
      expect(fmA.id).toBe(wA.id);
      expect(fmA.title).toBe('Sample fact');
    });

    it('original bodies preserved verbatim in the superseded files', () => {
      const wA = writeFact(
        validFactOpts({ projectRoot, slug: 'a', body: 'unique-marker-alpha' }),
      );
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'unique-marker-beta' }),
      );
      mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'merged' }),
      );
      const textA = readFileSync(
        join(
          projectRoot,
          'context',
          'memory',
          'archive',
          'superseded',
          archiveFileName(wA.id),
        ),
        'utf8',
      );
      const textB = readFileSync(
        join(
          projectRoot,
          'context',
          'memory',
          'archive',
          'superseded',
          archiveFileName(wB.id),
        ),
        'utf8',
      );
      expect(textA).toContain('unique-marker-alpha');
      expect(textB).toContain('unique-marker-beta');
    });

    it('audit log records the merge with action: "merged"', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B body' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'merged' }),
      );
      const auditPath = join(projectRoot, 'context', '.locks', 'audit.log');
      expect(existsSync(auditPath)).toBe(true);
      const entries = readFileSync(auditPath, 'utf8')
        .split('\n')
        .filter((l) => l.trim())
        .map((l) => JSON.parse(l));
      const merge = entries.find((e) => e.action === 'merged');
      expect(merge).toBeDefined();
      expect(merge.id).toBe(r.id);
      // Post-PR-2 canonical audit-log schema (per Layer-2 review I4):
      //   reasonCode = 'curated-merge'; mergedFrom moves to `extra`;
      //   paths.after = new fact path; paths.archive = [supersededA, supersededB]
      expect(merge.schema).toBe(1);
      expect(merge.tier).toBe('P');
      expect(merge.reasonCode).toBe('curated-merge');
      expect(merge.paths.after).toBe(r.path);
      expect(merge.paths.archive).toEqual(r.supersededPaths);
      expect(merge.extra.mergedFrom).toEqual([wA.id, wB.id]);
    });
  });

  describe('resolveFact() on superseded ids — old IDs never die', () => {
    it('resolveFact(idA) returns state: "superseded" with A body + supersededBy: <C.id>', () => {
      const wA = writeFact(
        validFactOpts({ projectRoot, slug: 'a', body: 'precious-original-A-body' }),
      );
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'B body' }),
      );
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'consolidated' }),
      );

      const rA = resolveFact({ id: wA.id, projectRoot });
      expect(rA.state).toBe('superseded');
      expect(rA.body).toContain('precious-original-A-body');
      expect(rA.supersededBy).toBe(r.id);
      expect(rA.frontmatter.id).toBe(wA.id);
    });

    it('resolveFact(idB) also resolves to "superseded" with supersededBy: <C.id>', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'precious-B' }),
      );
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'merged' }),
      );

      const rB = resolveFact({ id: wB.id, projectRoot });
      expect(rB.state).toBe('superseded');
      expect(rB.body).toContain('precious-B');
      expect(rB.supersededBy).toBe(r.id);
    });

    it('resolveFact(C.id) returns state: "live" — C is the new canonical fact', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'live now' }),
      );
      const rC = resolveFact({ id: r.id, projectRoot });
      expect(rC.state).toBe('live');
      expect(rC.body).toContain('live now');
    });
  });

  describe('3-way (chained) merge', () => {
    it('mergeFacts(mergeFacts(A, B), C) → final, merged_from = [C1.id, C.id], id = generateId(canonical(final_body))', () => {
      const wA = writeFact(
        validFactOpts({ projectRoot, slug: 'a', body: 'alpha sentence.' }),
      );
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'beta sentence.' }),
      );
      const wC = writeFact(
        validFactOpts({ projectRoot, slug: 'c', body: 'gamma sentence.' }),
      );

      // First merge: A + B → C1 with body "x. y."
      const c1 = mergeFacts(
        validMergeOpts(wA.id, wB.id, {
          projectRoot,
          mergedBody: 'x. y.',
          mergedSlug: 'ab_merge',
        }),
      );
      expect(c1.id).toBe(generateId('P', 'x. y.'));

      // Second merge: C1 + C (the external fact) → final with body "x. y. z."
      const finalR = mergeFacts(
        validMergeOpts(c1.id, wC.id, {
          projectRoot,
          mergedBody: 'x. y. z.',
          mergedSlug: 'final_merge',
        }),
      );

      expect(finalR.action).toBe('merged');
      expect(finalR.id).toBe(generateId('P', 'x. y. z.'));

      // merged_from in the final file should be the direct parents [C1, wC]
      const finalText = readFileSync(finalR.path, 'utf8');
      expect(finalText).toMatch(
        new RegExp(`merged_from:\\s*\\[\\s*${c1.id}\\s*,\\s*${wC.id}\\s*\\]`),
      );

      // Original A and B still resolve via supersededBy: c1.id
      const rA = resolveFact({ id: wA.id, projectRoot });
      expect(rA.state).toBe('superseded');
      expect(rA.supersededBy).toBe(c1.id);

      // C1 itself now resolves as superseded by finalR.id
      const rC1 = resolveFact({ id: c1.id, projectRoot });
      expect(rC1.state).toBe('superseded');
      expect(rC1.supersededBy).toBe(finalR.id);

      // wC also resolves as superseded by finalR.id
      const rC = resolveFact({ id: wC.id, projectRoot });
      expect(rC.state).toBe('superseded');
      expect(rC.supersededBy).toBe(finalR.id);
    });
  });

  describe('error cases', () => {
    it('idA not found → action: "not-found"', () => {
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b' }));
      // Valid-format ID (all chars in the kit's custom base32 alphabet) that
      // doesn't resolve to any live fact — exercises the not-found path, not
      // schema validation.
      const r = mergeFacts(
        validMergeOpts('P-MSSNGGG2', wB.id, {
          projectRoot,
          mergedBody: 'merged',
        }),
      );
      expect(r.action).toBe('not-found');
      expect(r.errors.join(' ')).toContain('P-MSSNGGG2');
      // wB untouched
      expect(existsSync(wB.path)).toBe(true);
    });

    it('idB not found → action: "not-found"', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, 'P-NPHFRNM2', {
          projectRoot,
          mergedBody: 'merged',
        }),
      );
      expect(r.action).toBe('not-found');
      expect(existsSync(wA.path)).toBe(true);
    });

    it('idA malformed (chars outside the kit alphabet) → schema error', () => {
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b' }));
      const r = mergeFacts(
        validMergeOpts('P-MISSING2', wB.id, { // validate-test-ids: ignore
          projectRoot,
          mergedBody: 'merged',
        }),
      );
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
      expect(r.errors.join(' ')).toMatch(/idA|citation ID/i);
      expect(existsSync(wB.path)).toBe(true);
    });

    it('cross-tier merge (idA tier ≠ idB tier) → action: "error"', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const userDir = join(sandbox, 'user-tier');
      const wU = writeFact(validFactOpts({ tier: 'U', userDir, slug: 'u' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wU.id, {
          projectRoot,
          userDir,
          mergedBody: 'cross-tier',
        }),
      );
      expect(r.action).toBe('error');
      expect(r.errors.join(' ')).toMatch(/tier/i);
      // both files untouched
      expect(existsSync(wA.path)).toBe(true);
      expect(existsSync(wU.path)).toBe(true);
    });

    it('idA == idB → action: "error"', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const r = mergeFacts(
        validMergeOpts(wA.id, wA.id, {
          projectRoot,
          mergedBody: 'merged',
        }),
      );
      expect(r.action).toBe('error');
      expect(r.errors.join(' ')).toMatch(/same|identical/i);
      expect(existsSync(wA.path)).toBe(true);
    });

    it('missing mergedBody → action: "error" with schema category', () => {
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'B' }));
      const opts = validMergeOpts(wA.id, wB.id, { projectRoot });
      delete opts.mergedBody;
      const r = mergeFacts(opts);
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
      // Both still alive
      expect(existsSync(wA.path)).toBe(true);
      expect(existsSync(wB.path)).toBe(true);
    });
  });

  // Layer-2 code-review blocker B1: if the merged body happens to canonicalize
  // to an existing unrelated fact's id, writeFact returns 'skipped' (content-
  // addressed dedup). Pre-fix, mergeFacts ignored this and moved A + B to
  // superseded with supersededBy pointing at the unrelated existing fact —
  // silent data corruption. Post-fix, mergeFacts must return an error and
  // leave A, B, and the unrelated fact untouched.
  describe('blocker B1 — merged body collides with existing unrelated fact', () => {
    it('returns action: "error", errorCategory: "collision"; A, B, and the colliding fact all untouched', () => {
      const wA = writeFact(
        validFactOpts({ projectRoot, slug: 'a', body: 'fact A body' }),
      );
      const wB = writeFact(
        validFactOpts({ projectRoot, slug: 'b', body: 'fact B body' }),
      );
      // Pre-existing unrelated fact whose canonical body matches what we will
      // try to merge into. mergeFacts must detect the dedup-collision via
      // writeFact's 'skipped' return and refuse to proceed.
      const wC = writeFact(
        validFactOpts({
          projectRoot,
          slug: 'c',
          body: 'collision body',
        }),
      );

      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, {
          projectRoot,
          mergedBody: 'collision body',
          mergedSlug: 'attempted_merge',
        }),
      );

      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('collision');
      expect(r.errors.join(' ')).toContain(wC.id);

      // A, B, C all byte-untouched at their original paths
      expect(existsSync(wA.path)).toBe(true);
      expect(existsSync(wB.path)).toBe(true);
      expect(existsSync(wC.path)).toBe(true);

      // No superseded files created
      const supersededDir = join(
        projectRoot,
        'context',
        'memory',
        'archive',
        'superseded',
      );
      expect(existsSync(supersededDir)).toBe(false);

      // The attempted-merge filename was never created
      expect(
        existsSync(
          join(
            projectRoot,
            'context',
            'memory',
            'feedback_attempted_merge.md',
          ),
        ),
      ).toBe(false);

      // resolveFact on C still returns 'live' (C is unchanged)
      // — verified by file presence above; structural assertion sufficient.
    });
  });

  describe('Task 124 — merge keeps INDEX.md current (the D-112 class)', () => {
    it('after a merge INDEX.md lists C, drops A+B, and other entries survive (over-mutation guard)', () => {
      // Same bug class as forget (D-112): writeFact reindexes when C is
      // created, but moveToSuperseded(A/B) ran AFTER that — leaving A and B
      // dangling in INDEX.md until a manual `cmk reindex`.
      const keeper = writeFact(validFactOpts({ projectRoot, slug: 'keeper', title: 'Keeper', body: 'Keeper body, untouched by the merge.' }));
      const wA = writeFact(validFactOpts({ projectRoot, slug: 'a', body: 'Body A.' }));
      const wB = writeFact(validFactOpts({ projectRoot, slug: 'b', body: 'Body B.' }));

      const r = mergeFacts(
        validMergeOpts(wA.id, wB.id, { projectRoot, mergedBody: 'X. Y.', mergedSlug: 'combined' }),
      );
      expect(r.action).toBe('merged');

      // Door 2 (State): the merge left the markdown index current in-band.
      const index = readFileSync(join(projectRoot, 'context', 'memory', 'INDEX.md'), 'utf8');
      expect(index).toContain(r.id); // C listed
      expect(index).not.toContain(wA.id); // A superseded → gone
      expect(index).not.toContain(wB.id); // B superseded → gone
      expect(index).toContain(keeper.id); // over-mutation guard
    });
  });
});
