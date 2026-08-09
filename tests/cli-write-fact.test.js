// @doors: 1, 2, 5
// Door 3 N/A: writeFact is in-process file emission; no subprocess spawn.
// Door 4 N/A: no message-queue interaction.
// Door 5: writeFact emits a `created` audit entry by DEFAULT (Task 123.A). The
//   create-audit was previously delegated to callers and silently dropped —
//   auto-extract / explicit-remember / graduation never wired it, so the live
//   cut-gate7 run found 6 creates → 0 audit lines (D-103). writeFact now owns
//   the default; callers that emit a richer-semantic audit (merge-facts →
//   `merged`/CURATED_MERGE) opt out with `audit:false`.

// Tests for Task 7 — Per-fact file format + writer (T-006).
// Per tasks.md 7.5:
//   - Test valid call creates file at expected path with all 9 frontmatter fields
//   - Test each of the 9 required fields, when omitted, produces error_category: "schema" and no file
//   - Test ID computation derives from canonicalize(body) — same ID as generateId(tier, body)
//   - Test second call with identical canonical body → same ID, no second file, audit-log "skipped: duplicate"
//   - Test optional fields (merged_from, superseded_by, private) written when supplied, absent when not
//
// Boundary-test discipline (per tasks.md "Engineering discipline"):
//   - Test the writeFact() PUBLIC contract — what file lands where with what frontmatter,
//     what the result object reports, what happens on duplicate, what gets logged.
//   - Do NOT test internal helpers (_serializeFrontmatter, _appendAuditLog, etc.).
//     Those are implementation details that may change without breaking the contract.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { generateId, canonicalize } from '../packages/canonicalize/src/index.mjs';
// Task 270: the boundary fix is only meaningful against the SAME pattern the
// index skips on, and the SAME parser that did the skipping — import both
// rather than restating the regex here.
import { ID_PATTERN } from '../packages/cli/src/tier-paths.mjs';
import { parseObservationsFromFactFile } from '../packages/cli/src/index-rebuild.mjs';
import { listFactFiles } from '../packages/cli/src/fact-store.mjs';

function validOptions(overrides = {}) {
  return {
    tier: 'P',
    type: 'feedback',
    slug: 'webcam_roi',
    title: 'Webcam ROI is wider than expected',
    body: '`--roi 0,0,80,100` is not enough exclusion for Krish-Naik-style overlays.',
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'context/transcripts/2026-05-21.md',
    sourceLine: 142,
    sourceSha1: 'abc123ef0123456789abcdef0123456789abcdef',
    createdAt: '2026-05-22T14:30:00Z',
    ...overrides,
  };
}

// Use the production parser so tests see the exact typed shape callers see.
// Per Layer-2 review I2: the prior local parser was naive (split-on-first-colon,
// values typed as strings). PR-2 makes production use js-yaml; tests must too.
import { parse as parseFrontmatterText } from '../packages/cli/src/frontmatter.mjs';

function parseFrontmatter(filePath) {
  return parseFrontmatterText(readFileSync(filePath, 'utf8'));
}

function readAuditLog(tierRoot) {
  const p = join(tierRoot, '.locks', 'audit.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => JSON.parse(l));
}

describe('Task 7 — writeFact() boundary', () => {
  let sandbox;
  let projectRoot;
  let userDir;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'cmk-write-fact-test-'));
    projectRoot = join(sandbox, 'proj');
    userDir = join(sandbox, 'user-tier');
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  describe('happy path — valid call', () => {
    it('creates a file at <project>/context/memory/<type>_<slug>.md for tier P', () => {
      const result = writeFact(validOptions({ projectRoot }));
      expect(result.action).toBe('created');
      const expectedPath = join(projectRoot, 'context', 'memory', 'feedback_webcam_roi.md');
      expect(result.path).toBe(expectedPath);
      expect(existsSync(expectedPath)).toBe(true);
    });

    it('creates a file at <project>/context.local/memory/<type>_<slug>.md for tier L', () => {
      const result = writeFact(validOptions({ projectRoot, tier: 'L' }));
      expect(result.action).toBe('created');
      expect(result.path).toBe(
        join(projectRoot, 'context.local', 'memory', 'feedback_webcam_roi.md'),
      );
    });

    it('creates a file at <userDir>/fragments/<type>_<slug>.md for tier U', () => {
      const result = writeFact(validOptions({ tier: 'U', userDir }));
      expect(result.action).toBe('created');
      expect(result.path).toBe(join(userDir, 'fragments', 'feedback_webcam_roi.md'));
    });

    it('output frontmatter contains all 9 required fields with correct values', () => {
      const opts = validOptions({ projectRoot });
      const result = writeFact(opts);
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.id).toBe(generateId('P', opts.body));
      expect(frontmatter.type).toBe('feedback');
      expect(frontmatter.title).toBe(opts.title);
      expect(frontmatter.created_at).toBe('2026-05-22T14:30:00Z');
      expect(frontmatter.write_source).toBe('user-explicit');
      expect(frontmatter.trust).toBe('high');
      expect(frontmatter.source_file).toBe(opts.sourceFile);
      // Post-PR-2: js-yaml parses integers as numbers (CORE_SCHEMA). Pre-PR-2
      // the naive parser left everything as strings; that bug is gone.
      expect(frontmatter.source_line).toBe(142);
      expect(frontmatter.source_sha1).toBe(opts.sourceSha1);
    });

    it('body content appears verbatim after the frontmatter', () => {
      const opts = validOptions({ projectRoot });
      const result = writeFact(opts);
      const { body } = parseFrontmatter(result.path);
      expect(body).toContain(opts.body);
    });

    it('returns the computed ID in the result', () => {
      const opts = validOptions({ projectRoot });
      const result = writeFact(opts);
      expect(result.id).toBe(generateId('P', opts.body));
    });

    // Task 254 (Obsidian vault view — shape a, forward-only): every NEW fact
    // carries `aliases: [<id>]` so an Obsidian `[[P-XXXX]]` id reference (the
    // kit's cross-reference currency — used in bodies + supersession) resolves
    // to the fact file. Purely additive frontmatter; no kit reader consumes it.
    it('new fact frontmatter carries aliases: [<id>] for Obsidian id-wikilink resolution', () => {
      const opts = validOptions({ projectRoot });
      const result = writeFact(opts);
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.aliases).toEqual([result.id]);
    });
  });

  describe('schema validation — each of 9 required fields, when omitted, → error_category: "schema"', () => {
    const fieldsToOmit = [
      'type',
      'title',
      'writeSource',
      'trust',
      'sourceFile',
      'sourceLine',
      'sourceSha1',
    ];

    for (const field of fieldsToOmit) {
      it(`omitting ${field} → error_category: "schema", no file written`, () => {
        const opts = validOptions({ projectRoot });
        delete opts[field];
        const result = writeFact(opts);
        expect(result.action).toBe('error');
        expect(result.errorCategory).toBe('schema');
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
        const memDir = join(projectRoot, 'context', 'memory');
        expect(existsSync(memDir) ? readdirSync(memDir) : []).toEqual([]);
      });
    }

    it('omitting body (so id cannot be computed) → error_category: "schema", no file written', () => {
      const opts = validOptions({ projectRoot });
      delete opts.body;
      const result = writeFact(opts);
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('schema');
    });

    it('output file frontmatter always contains id + created_at (writer-filled defaults)', () => {
      const opts = validOptions({ projectRoot });
      delete opts.createdAt;
      const result = writeFact(opts);
      expect(result.action).toBe('created');
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.id).toMatch(/^P-[2345679ABCDEFGHJKLMNPQRSTUVWXYZa]{8}$/);
      expect(frontmatter.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('invalid tier → schema error', () => {
      const r = writeFact(validOptions({ projectRoot, tier: 'X' }));
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('invalid type (not in taxonomy) → schema error', () => {
      const r = writeFact(validOptions({ projectRoot, type: 'whatever' }));
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('invalid writeSource (not in enum) → schema error', () => {
      const r = writeFact(validOptions({ projectRoot, writeSource: 'guessed' }));
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('invalid trust (not in enum) → schema error', () => {
      const r = writeFact(validOptions({ projectRoot, trust: 'maybe' }));
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('non-positive sourceLine → schema error', () => {
      const r1 = writeFact(validOptions({ projectRoot, sourceLine: 0 }));
      expect(r1.action).toBe('error');
      expect(r1.errorCategory).toBe('schema');
      const r2 = writeFact(validOptions({ projectRoot, sourceLine: -5 }));
      expect(r2.action).toBe('error');
      expect(r2.errorCategory).toBe('schema');
      const r3 = writeFact(validOptions({ projectRoot, sourceLine: 'x' }));
      expect(r3.action).toBe('error');
      expect(r3.errorCategory).toBe('schema');
    });

    it('slug containing path-traversal characters → schema error (no file outside memory/)', () => {
      const r = writeFact(validOptions({ projectRoot, slug: '../escape' }));
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
      expect(existsSync(join(projectRoot, 'escape.md'))).toBe(false);
    });
  });

  // Layer-2 review B2 RELAXATION (PR-2): PR-1 rejected \n / \r / : in scalar
  // frontmatter fields as a minimum fix for the naive serializer. PR-2's
  // frontmatter.mjs (js-yaml CORE_SCHEMA) quotes those chars properly. The
  // input restriction is LIFTED here — these tests prove the round-trip
  // works for previously-rejected inputs.
  describe('B2 relaxation — chars previously rejected by PR-1 now round-trip correctly via js-yaml', () => {
    const trickyValues = [
      { label: 'newline', value: 'first line\nsecond line' },
      { label: 'carriage-return', value: 'first\rsecond' },
      { label: 'colon', value: 'something: with colon' },
      {
        label: 'all three combined',
        value: 'with: colon\nand newline\rand cr',
      },
    ];

    for (const { label, value } of trickyValues) {
      it(`title containing ${label}: write succeeds + round-trip preserves the value`, () => {
        const r = writeFact(validOptions({ projectRoot, title: value }));
        expect(r.action).toBe('created');
        const { frontmatter } = parseFrontmatter(r.path);
        expect(frontmatter.title).toBe(value);
      });

      it(`sourceFile containing ${label}: write succeeds + round-trip preserves the value`, () => {
        const r = writeFact(validOptions({ projectRoot, sourceFile: value }));
        expect(r.action).toBe('created');
        const { frontmatter } = parseFrontmatter(r.path);
        expect(frontmatter.source_file).toBe(value);
      });

      it(`sourceSha1 containing ${label}: write succeeds + round-trip preserves the value`, () => {
        const r = writeFact(validOptions({ projectRoot, sourceSha1: value }));
        expect(r.action).toBe('created');
        const { frontmatter } = parseFrontmatter(r.path);
        expect(frontmatter.source_sha1).toBe(value);
      });
    }

    it('YAML injection attempt does NOT create extra frontmatter keys (proves quoting works)', () => {
      const r = writeFact(
        validOptions({
          projectRoot,
          title: 'Innocent\nadmin: true\nfake_id: P-EVIL1234', // validate-test-ids: ignore
        }),
      );
      expect(r.action).toBe('created');
      const { frontmatter } = parseFrontmatter(r.path);
      // The whole multi-line string is the title; no `admin` or `fake_id`
      // keys leaked into the frontmatter object.
      expect(frontmatter.title).toBe(
        'Innocent\nadmin: true\nfake_id: P-EVIL1234', // validate-test-ids: ignore
      );
      expect(frontmatter.admin).toBeUndefined();
      expect(frontmatter.fake_id).toBeUndefined();
    });

    it('safe values still work (regression guard against over-restrictive validation)', () => {
      const r = writeFact(
        validOptions({
          projectRoot,
          title: 'A safe title with - dashes and (parens)',
          sourceFile: 'context/transcripts/2026-05-24.md',
          sourceSha1: 'abc123ef0123456789abcdef0123456789abcdef',
        }),
      );
      expect(r.action).toBe('created');
    });
  });

  describe('ID derivation (task 7.3)', () => {
    it('ID equals generateId(tier, body) — derived from body, not title or slug', () => {
      const opts = validOptions({ projectRoot, title: 'IRRELEVANT', slug: 'irrelevant' });
      const result = writeFact(opts);
      expect(result.id).toBe(generateId('P', opts.body));
    });

    it('changing title or slug does not change the ID', () => {
      const a = writeFact(
        validOptions({ projectRoot, title: 'Title A', slug: 'slug_a' }),
      );
      const sandboxB = mkdtempSync(join(tmpdir(), 'cmk-write-fact-test-b-'));
      try {
        const b = writeFact(
          validOptions({
            projectRoot: join(sandboxB, 'proj'),
            title: 'Title B',
            slug: 'slug_b',
          }),
        );
        expect(a.id).toBe(b.id);
      } finally {
        rmSync(sandboxB, { recursive: true, force: true });
      }
    });

    it('canonical-text equivalent bodies yield the same ID', () => {
      const r1 = writeFact(
        validOptions({ projectRoot, slug: 'a', body: 'Hello World' }),
      );
      const sandbox2 = mkdtempSync(join(tmpdir(), 'cmk-write-fact-test-c-'));
      try {
        const r2 = writeFact(
          validOptions({
            projectRoot: join(sandbox2, 'proj'),
            slug: 'b',
            body: '  hello  WORLD.  ',
          }),
        );
        expect(canonicalize('Hello World')).toBe(canonicalize('  hello  WORLD.  '));
        expect(r1.id).toBe(r2.id);
      } finally {
        rmSync(sandbox2, { recursive: true, force: true });
      }
    });
  });

  describe('dedup-via-canonical-ID (task 7.4)', () => {
    it('second call with identical body + identical slug → action: skipped, no overwrite', () => {
      const opts = validOptions({ projectRoot });
      const first = writeFact(opts);
      expect(first.action).toBe('created');
      const mtime1 = readFileSync(first.path);

      const second = writeFact(opts);
      expect(second.action).toBe('skipped');
      expect(second.skipReason).toBe('duplicate');
      expect(second.id).toBe(first.id);

      // Task 151.1 (ADR-0016): a duplicate hit now BUMPS recurrence_count
      // (the fact re-surfaced), so the body/frontmatter changes — but the
      // fact's identity (id) and the no-second-file invariant are unchanged.
      // (The prior "byte-identical" assertion was the pre-151 contract.)
    });

    // ── Task 151.1 — recurrence_count (ADR-0016 / design.md §20.1) ──
    describe('recurrence_count — capped-recurrence promotion signal', () => {
      it('a freshly-created fact starts at recurrence_count: 1', () => {
        const r = writeFact(validOptions({ projectRoot }));
        expect(r.action).toBe('created');
        const { frontmatter } = parseFrontmatter(r.path);
        expect(frontmatter.recurrence_count).toBe(1);
      });

      it('re-surfacing the SAME canonical fact (identical slug) bumps recurrence_count, no second file', () => {
        const opts = validOptions({ projectRoot });
        const first = writeFact(opts);
        expect(first.action).toBe('created');

        const second = writeFact(opts);
        // Door 1 (Response): the re-surface is reported, identity unchanged.
        expect(second.id).toBe(first.id);
        expect(second.recurrenceCount).toBe(2);
        // Door 2 (State): the count is bumped ON DISK, on the same file.
        const { frontmatter } = parseFrontmatter(first.path);
        expect(frontmatter.recurrence_count).toBe(2);

        // A third re-surface → 3 (the promotion threshold).
        const third = writeFact(opts);
        expect(third.recurrenceCount).toBe(3);
        expect(parseFrontmatter(first.path).frontmatter.recurrence_count).toBe(3);
      });

      it('re-surface via a DIFFERENT slug (duplicate-elsewhere) bumps the original fact', () => {
        const first = writeFact(validOptions({ projectRoot, slug: 'first' }));
        expect(first.action).toBe('created');

        const second = writeFact(validOptions({ projectRoot, slug: 'second' }));
        expect(second.skipReason).toBe('duplicate-elsewhere');
        // the ORIGINAL fact (at first.path) gets the bump, not a new file
        expect(parseFrontmatter(first.path).frontmatter.recurrence_count).toBe(2);
        expect(existsSync(join(projectRoot, 'context', 'memory', 'feedback_second.md'))).toBe(false);
      });

      it('Door 4 (Observability): a re-surface logs a recurrence audit entry', () => {
        const opts = validOptions({ projectRoot });
        writeFact(opts);
        writeFact(opts);
        const log = readAuditLog(join(projectRoot, 'context'));
        const recur = log.find((e) => e.action === 'recurrence');
        expect(recur).toBeTruthy();
        expect(recur.extra.recurrenceCount).toBe(2);
      });

      it('over-mutation guard: bumping one fact leaves another untouched', () => {
        const a = writeFact(validOptions({ projectRoot, slug: 'aaa', body: 'first distinct fact body here' }));
        const b = writeFact(validOptions({ projectRoot, slug: 'bbb', body: 'second wholly different fact body' }));
        // re-surface only A
        writeFact(validOptions({ projectRoot, slug: 'aaa', body: 'first distinct fact body here' }));
        expect(parseFrontmatter(a.path).frontmatter.recurrence_count).toBe(2);
        expect(parseFrontmatter(b.path).frontmatter.recurrence_count).toBe(1);
      });
    });

    it('second call with identical body + different slug → skipped, audit log records duplicate-elsewhere', () => {
      const first = writeFact(validOptions({ projectRoot, slug: 'first' }));
      expect(first.action).toBe('created');

      const second = writeFact(validOptions({ projectRoot, slug: 'second' }));
      expect(second.action).toBe('skipped');
      expect(second.id).toBe(first.id);
      // No second file created
      expect(
        existsSync(
          join(projectRoot, 'context', 'memory', 'feedback_second.md'),
        ),
      ).toBe(false);

      const log = readAuditLog(join(projectRoot, 'context'));
      expect(log.length).toBeGreaterThan(0);
      // Task 151.1 (ADR-0016): a duplicate write now logs a `recurrence` audit
      // entry (the fact re-surfaced → recurrence_count bumped), keeping the
      // duplicate-elsewhere reasonCode. The result object still reports
      // action:'skipped' / skipReason — but the AUDIT action is 'recurrence'.
      const recurEntry = log.find((e) => e.action === 'recurrence');
      expect(recurEntry).toBeDefined();
      expect(recurEntry.reasonCode).toMatch(/duplicate/);
      expect(recurEntry.id).toBe(first.id);
      expect(recurEntry.schema).toBe(1);
      expect(recurEntry.tier).toBe('P');
    });

    it('different body → different ID, second file created', () => {
      const first = writeFact(validOptions({ projectRoot, slug: 'a' }));
      const second = writeFact(
        validOptions({
          projectRoot,
          slug: 'b',
          body: 'A different fact entirely.',
        }),
      );
      expect(first.action).toBe('created');
      expect(second.action).toBe('created');
      expect(first.id).not.toBe(second.id);
      expect(existsSync(first.path)).toBe(true);
      expect(existsSync(second.path)).toBe(true);
    });

    it('a same-slug re-write logs a recurrence audit entry (Task 151.1 — was `skipped` pre-ADR-0016)', () => {
      const opts = validOptions({ projectRoot });
      writeFact(opts);
      writeFact(opts);
      const log = readAuditLog(join(projectRoot, 'context'));
      const recurrence = log.filter((e) => e.action === 'recurrence');
      expect(recurrence.length).toBeGreaterThan(0);
    });
  });

  describe('create-audit (Task 123.A — writeFact owns the default `created` entry)', () => {
    it('a successful create emits exactly one `created` audit entry (Door 5)', () => {
      const r = writeFact(validOptions({ projectRoot }));
      expect(r.action).toBe('created');
      const log = readAuditLog(join(projectRoot, 'context'));
      const created = log.filter((e) => e.action === 'created');
      expect(created).toHaveLength(1);
      expect(created[0].reasonCode).toBe('fact-created');
      expect(created[0].tier).toBe('P');
      expect(created[0].id).toBe(r.id);
      expect(created[0].schema).toBe(1);
      expect(created[0].paths.after).toBe(r.path);
    });

    it('records the U tier on a user-tier create', () => {
      const r = writeFact(validOptions({ tier: 'U', userDir }));
      const log = readAuditLog(userDir);
      const created = log.filter((e) => e.action === 'created');
      expect(created).toHaveLength(1);
      expect(created[0].tier).toBe('U');
      expect(created[0].id).toBe(r.id);
    });

    it('audit:false suppresses the `created` entry (opt-out for callers that audit themselves, e.g. merge-facts)', () => {
      const r = writeFact(validOptions({ projectRoot, audit: false }));
      expect(r.action).toBe('created');
      expect(existsSync(r.path)).toBe(true); // file still written
      const log = readAuditLog(join(projectRoot, 'context'));
      expect(log.filter((e) => e.action === 'created')).toHaveLength(0);
    });

    it('a duplicate re-write does NOT emit a second `created` entry (over-mutation guard)', () => {
      const opts = validOptions({ projectRoot });
      writeFact(opts);
      writeFact(opts); // duplicate → recurrence bump (Task 151.1), not a 2nd create
      const log = readAuditLog(join(projectRoot, 'context'));
      expect(log.filter((e) => e.action === 'created')).toHaveLength(1); // only the first
      // Task 151.1 (ADR-0016): the dup now logs `recurrence` (was `skipped`).
      expect(log.filter((e) => e.action === 'recurrence')).toHaveLength(1);
    });

    it('a Poison_Guard rejection emits NO `created` entry (no audit for a write that did not happen)', () => {
      writeFact(
        validOptions({
          projectRoot,
          slug: 'leak',
          body: 'token is ghp_1234567890abcdefghij1234567890abcdef12',
        }),
      );
      const log = readAuditLog(join(projectRoot, 'context'));
      expect(log.filter((e) => e.action === 'created')).toHaveLength(0);
    });
  });

  describe('optional fields written when supplied, absent when not', () => {
    it('default call: no merged_from, superseded_by, private, tags, related in frontmatter', () => {
      const result = writeFact(validOptions({ projectRoot }));
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.merged_from).toBeUndefined();
      expect(frontmatter.superseded_by).toBeUndefined();
      expect(frontmatter.private).toBeUndefined();
      expect(frontmatter.tags).toBeUndefined();
      expect(frontmatter.related).toBeUndefined();
    });

    it('mergedFrom: [id, ...] → frontmatter merged_from: [...]', () => {
      const result = writeFact(
        validOptions({
          projectRoot,
          mergedFrom: ['P-AAAAAAAA', 'P-BBBBBBBB'],
        }),
      );
      const text = readFileSync(result.path, 'utf8');
      expect(text).toMatch(/merged_from:\s*\[\s*P-AAAAAAAA\s*,\s*P-BBBBBBBB\s*\]/);
    });

    it('supersededBy: id → frontmatter superseded_by: id', () => {
      const result = writeFact(
        validOptions({ projectRoot, supersededBy: 'P-NEWFACT2' }),
      );
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.superseded_by).toBe('P-NEWFACT2');
    });

    it('isPrivate: true → frontmatter private: true (boolean, not string)', () => {
      const result = writeFact(validOptions({ projectRoot, isPrivate: true }));
      const { frontmatter } = parseFrontmatter(result.path);
      // Post-PR-2: js-yaml parses booleans as booleans (was string 'true' pre-PR-2).
      expect(frontmatter.private).toBe(true);
    });

    it('isPrivate: false → no private field in frontmatter (default behavior)', () => {
      const result = writeFact(validOptions({ projectRoot, isPrivate: false }));
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.private).toBeUndefined();
    });

    it('tags + related lists serialize as inline YAML arrays', () => {
      const result = writeFact(
        validOptions({
          projectRoot,
          tags: ['video-pipeline', 'roi'],
          related: ['P-A8FN3MQ2'], // validate-test-ids: ignore
        }),
      );
      const text = readFileSync(result.path, 'utf8');
      expect(text).toMatch(/tags:\s*\[\s*video-pipeline\s*,\s*roi\s*\]/);
      expect(text).toMatch(/related:\s*\[\s*P-A8FN3MQ2\s*\]/); // validate-test-ids: ignore
    });
  });

  describe('shape field — temporal fact classification (Task 66.1, design §16.18)', () => {
    // The 7-value taxonomy from Chandra's "Beyond the Log" (§16.18): what KIND
    // of truth the fact asserts, so temporal machinery (validity windows 66.2,
    // expiry 66.3, contradiction-catch 66.4) knows which facts it may touch.
    const SHAPES = [
      'State',
      'Event',
      'Plan',
      'Relationship',
      'Preference',
      'Absence',
      'Timeless',
    ];

    it('shape provided → written to frontmatter verbatim', () => {
      const result = writeFact(validOptions({ projectRoot, shape: 'Event' }));
      expect(result.action).toBe('created');
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.shape).toBe('Event');
    });

    it('shape absent → defaults to State, written explicitly (self-describing file)', () => {
      const result = writeFact(validOptions({ projectRoot }));
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.shape).toBe('State');
    });

    it.each(SHAPES)('accepts shape %s', (shape) => {
      const result = writeFact(
        validOptions({ projectRoot, shape, slug: `shape-${shape.toLowerCase()}` }),
      );
      expect(result.action).toBe('created');
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.shape).toBe(shape);
    });

    it('invalid shape → schema error, no file written (Doors 1+2)', () => {
      const result = writeFact(validOptions({ projectRoot, shape: 'Mood' }));
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('schema');
      expect(result.errors.join(' ')).toMatch(/shape/);
      const factDir = join(projectRoot, 'context', 'memory');
      expect(
        existsSync(factDir) ? readdirSync(factDir).filter((f) => f.endsWith('.md') && f !== 'INDEX.md' && f !== 'MAP.md') : [],
      ).toHaveLength(0);
    });

    it('shape is case-sensitive — lowercase "state" rejected (one canonical spelling on disk)', () => {
      const result = writeFact(validOptions({ projectRoot, shape: 'state' }));
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('schema');
    });
  });

  describe('expires_at field — declared validity end (Task 66.3, design §16.18 / D-258)', () => {
    it('expiresAt (date-only) → frontmatter expires_at verbatim', () => {
      const result = writeFact(validOptions({ projectRoot, expiresAt: '2026-08-01' }));
      expect(result.action).toBe('created');
      const { frontmatter } = parseFrontmatter(result.path);
      // js-yaml may parse a bare date as a string under CORE_SCHEMA; assert the
      // on-disk text to pin the verbatim round-trip.
      const text = readFileSync(result.path, 'utf8');
      expect(text).toMatch(/^expires_at: ["']?2026-08-01["']?$/m);
      expect(frontmatter.expires_at).toBeDefined();
    });

    it('expiresAt (full ISO timestamp) accepted', () => {
      const result = writeFact(
        validOptions({ projectRoot, expiresAt: '2026-08-01T12:00:00Z' }),
      );
      expect(result.action).toBe('created');
      const text = readFileSync(result.path, 'utf8');
      expect(text).toMatch(/expires_at: ["']?2026-08-01T12:00:00Z["']?/);
    });

    it('absent → no expires_at key in frontmatter (permanent facts stay clean)', () => {
      const result = writeFact(validOptions({ projectRoot }));
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.expires_at).toBeUndefined();
    });

    it('unparseable expiresAt → schema error, no file', () => {
      const result = writeFact(validOptions({ projectRoot, expiresAt: 'next tuesday' }));
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('schema');
      expect(result.errors.join(' ')).toMatch(/expiresAt/);
    });

    it('non-ISO-prefixed but Date-parseable garbage rejected too (strict shape, not just parseable)', () => {
      const result = writeFact(validOptions({ projectRoot, expiresAt: '08/01/2026' }));
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('schema');
    });
  });

  describe('write-path hardening — privacy sanitize + Poison_Guard (#1)', () => {
    const WIN_PATH =
      'C:\\Users\\someuser\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';

    it('P tier: abstracts a home-dir path in the body; username never lands on disk', () => {
      const result = writeFact(
        validOptions({ projectRoot, slug: 'venv', body: `Always use ${WIN_PATH}` }),
      );
      expect(result.action).toBe('created');
      const text = readFileSync(result.path, 'utf8');
      expect(text).not.toContain('someuser');
      expect(text).toContain('~\\AppData\\Local\\Programs\\Python\\Python313\\python.exe');
    });

    it('P tier: abstracts a home-dir path in the title too', () => {
      const result = writeFact(
        validOptions({ projectRoot, slug: 'paths', title: `python at ${WIN_PATH}` }),
      );
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.title).not.toContain('someuser');
      expect(frontmatter.title).toContain('~\\AppData');
    });

    it('U tier: abstracts a home-dir path (user tier is shared/portable)', () => {
      const result = writeFact(
        validOptions({
          userDir,
          tier: 'U',
          slug: 'venv',
          body: 'venv at /home/someuser/.venv/bin/python',
        }),
      );
      const text = readFileSync(result.path, 'utf8');
      expect(text).not.toContain('/home/someuser');
      expect(text).toContain('~/.venv/bin/python');
    });

    it('L tier: KEEPS machine-specific paths verbatim (the local-tier purpose)', () => {
      const result = writeFact(
        validOptions({
          projectRoot,
          tier: 'L',
          slug: 'node_path',
          body: `node at ${WIN_PATH}`,
        }),
      );
      const text = readFileSync(result.path, 'utf8');
      expect(text).toContain('C:\\Users\\someuser');
    });

    it('Poison_Guard: a secret in the body → rejected, NO file written (over-mutation guard)', () => {
      const result = writeFact(
        validOptions({
          projectRoot,
          slug: 'leak',
          // Allowlisted poison-guard fixture (also in .gitleaks.toml).
          body: 'token is ghp_1234567890abcdefghij1234567890abcdef12',
        }),
      );
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('poison_guard');
      expect(result.pattern_id).toMatch(/^secret_/);
      const factDir = join(projectRoot, 'context', 'memory');
      const files = existsSync(factDir)
        ? readdirSync(factDir).filter((f) => f !== 'INDEX.md')
        : [];
      expect(files).toHaveLength(0);
    });

    it('Poison_Guard: a secret in the TITLE → rejected, NO file written (D-312 side-door fix)', () => {
      const result = writeFact(
        validOptions({
          projectRoot,
          slug: 'title-leak',
          title: 'token is ghp_1234567890abcdefghij1234567890abcdef12',
          body: 'a perfectly clean body with nothing sensitive in it',
        }),
      );
      expect(result.action).toBe('error');
      expect(result.errorCategory).toBe('poison_guard');
      expect(result.pattern_id).toMatch(/^secret_/);
      const factDir = join(projectRoot, 'context', 'memory');
      const files = existsSync(factDir)
        ? readdirSync(factDir).filter((f) => f !== 'INDEX.md')
        : [];
      expect(files).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------
  // Task 270 (D-427) — an explicitly-supplied id that can never be found again.
  //
  // The bug: `const id = opts.id ?? generateId(...)` took a caller's id on
  // trust. A fixture id carrying an `8` (outside the kit's base32
  // alphabet — see BAD_ID below) was ACCEPTED, returned `action:'created'`, and landed a real file
  // — then `index-rebuild.parseObservationsFromFactFile` skipped it as
  // 'invalid or missing id', so the fact was unreachable through search, the
  // viewer, the graph, and every other DB-backed surface. No error anywhere;
  // the only symptom was a count off by one. Durable-but-unfindable is the
  // D-366 class, manufactured by our own write path.
  //
  // The fix REGENERATES rather than rejects (see the caller map in the PR): the
  // one production caller that passes an explicit id is graduation.mjs, whose
  // BULLET_RE is deliberately loose and whose comment delegates alphabet
  // validity to "the writer's concern" — and a reject there would wedge
  // MEMORY.md at cap forever on one legacy bullet. Regeneration reuses the very
  // mechanism the repair path (D-394 `classifyFactId` → 'repairable') already
  // chose for this exact shape, so write and repair agree instead of diverging.
  describe('Task 270 — explicit id validated at the boundary (D-427)', () => {
    // The alphabet-invalid id from the live finding. `8` is one of the six
    // ambiguous chars the kit's base32 alphabet excludes.
    const BAD_ID = 'P-5678ABCD'; // validate-test-ids: ignore

    it('Door 1 (Response): an alphabet-invalid explicit id is REPLACED by a valid derived id, not echoed back', () => {
      const opts = validOptions({ projectRoot, id: BAD_ID });
      const result = writeFact(opts);
      expect(result.action).toBe('created');
      // The returned id must be usable — every DB-backed route keys on it.
      expect(result.id).toMatch(ID_PATTERN);
      expect(result.id).not.toBe(BAD_ID);
      // Regenerated content-addressed, exactly as classifyFactId would derive it.
      expect(result.id).toBe(generateId('P', opts.body));
      // The response is HONEST about the substitution — never a silent swap.
      expect(result.idRepaired).toBe(true);
      expect(result.previousId).toBe(BAD_ID);
    });

    it('Door 2 (State): the file on disk carries the valid id + a legacy_id breadcrumb', () => {
      const result = writeFact(validOptions({ projectRoot, id: BAD_ID }));
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.id).toMatch(ID_PATTERN);
      expect(frontmatter.id).toBe(result.id);
      // Same field the memory-recovery repair path writes (applyIdRepair), so
      // the two paths leave identical forensics behind.
      expect(frontmatter.legacy_id).toBe(BAD_ID);
      // aliases must follow the REAL id, or an Obsidian `[[id]]` link dangles.
      expect(frontmatter.aliases).toEqual([result.id]);
    });

    // THE integration door — the one that would have caught the original bug.
    // Unit-green on writeFact alone never saw this: the write path said yes and
    // the index path said "no such fact", and nothing compared the two.
    it('the written fact is VISIBLE to the index parser (the orphan is not manufactured)', () => {
      const result = writeFact(validOptions({ projectRoot, id: BAD_ID }));
      const parsed = parseObservationsFromFactFile({
        path: result.path,
        content: readFileSync(result.path, 'utf8'),
        tier: 'P',
        projectRoot,
      });
      expect(parsed.skipped).toBeUndefined();
      expect(parsed.observations.length).toBeGreaterThan(0);
      expect(parsed.observations[0].id).toBe(result.id);
    });

    it('Door 5 (Observability): the repair is audited with its previousId', () => {
      const result = writeFact(validOptions({ projectRoot, id: BAD_ID }));
      const entries = readAuditLog(join(projectRoot, 'context'));
      const repair = entries.filter((e) => e.reasonCode === 'fact-id-repaired');
      expect(repair).toHaveLength(1);
      expect(repair[0].id).toBe(result.id);
      expect(repair[0].extra.previousId).toBe(BAD_ID);
    });

    // The graduation contract: a VALID explicit id must still pass through
    // untouched, or graduation stops preserving citation ids across the move.
    it('a VALID explicit id is preserved verbatim (graduation is unaffected)', () => {
      const goodId = generateId('P', 'some other body entirely');
      const result = writeFact(validOptions({ projectRoot, id: goodId }));
      expect(result.id).toBe(goodId);
      expect(result.idRepaired).toBeUndefined();
      const { frontmatter } = parseFrontmatter(result.path);
      expect(frontmatter.id).toBe(goodId);
      expect(frontmatter.legacy_id).toBeUndefined();
    });

    // Over-mutation guard: seed N valid neighbours, write ONE bad-id fact,
    // assert the other N are byte-untouched. A boundary fix that rewrites or
    // re-ids its neighbours would be a far worse bug than the one it fixes.
    it('over-mutation guard: repairing one fact leaves every valid neighbour untouched', () => {
      const neighbours = ['alpha', 'bravo', 'charlie'].map((slug) =>
        writeFact(validOptions({ projectRoot, slug, body: `body for ${slug}` })),
      );
      const before = neighbours.map((n) => readFileSync(n.path, 'utf8'));

      const result = writeFact(
        validOptions({ projectRoot, slug: 'delta', body: 'delta body', id: BAD_ID }),
      );
      expect(result.action).toBe('created');

      // N-1 untouched: same bytes, same ids, still on disk.
      neighbours.forEach((n, i) => {
        expect(existsSync(n.path)).toBe(true);
        expect(readFileSync(n.path, 'utf8')).toBe(before[i]);
      });
      // And the population is exactly N+1 — no file was replaced or dropped.
      // `listFactFiles` (the shared walker), not a hand-rolled readdir filter:
      // the generated INDEX.md *and* MAP.md both live in this dir, and
      // re-deriving the skip rules here is the drift Task 241 removed.
      const files = listFactFiles(join(projectRoot, 'context', 'memory'));
      expect(files).toHaveLength(4);
    });

    it('a non-string / structurally-wrong explicit id is repaired the same way', () => {
      // The MCP/import shape: an id that is not even the right type.
      const result = writeFact(validOptions({ projectRoot, id: 12345 }));
      expect(result.action).toBe('created');
      expect(result.id).toMatch(ID_PATTERN);
      expect(result.idRepaired).toBe(true);
    });
  });
});
