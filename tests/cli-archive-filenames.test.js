// @doors: 1, 2, 5
// Door 3 N/A: archive filename derivation + tombstone moves are in-process file
//   IO; no subprocess is spawned on any path under test.
// Door 4 N/A: no message-queue interaction.
//
// Tests for Task 281 — two valid ids differing only by `A`/`a` collapse to ONE
// archive file on case-insensitive filesystems, destroying a tombstone.
//
// The kit's base32 alphabet (`2345679ABCDEFGHJKLMNPQRSTUVWXYZa`, tier-paths.mjs)
// excludes `0/O/1/l/I/8` for visual ambiguity but keeps BOTH `A` and `a` — the
// one case-pair in the alphabet. Archive files were named `<id>.md` verbatim, so
// `P-A234567A` and `P-a234567A` resolved to the SAME path on Windows/macOS: the
// second write silently destroyed the first. Severity is not cosmetic —
// `rootIdCensus` (memory-recovery) reads tombstone ids to avoid resurrecting a
// deliberately-forgotten fact, so a lost tombstone can UNDO a `forget`.
//
// Boundary-test discipline:
//   - Test the PUBLIC contract of the shared filename helper (what name an id
//     maps to, what id a name maps back to) and the PUBLIC contract of the
//     surfaces that consume it (forget / resolveFact / recoverMemory).
//   - Do NOT reach into the escaping internals — the escape SPELLING is an
//     implementation choice; the contract is "distinct ids never share a name,
//     and every name maps back to its id".

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  archiveFileName,
  archiveIdFromFileName,
  archiveReadPath,
  archiveCandidatePaths,
} from '../packages/cli/src/fact-store.mjs';
import { forget, resolveFact } from '../packages/cli/src/forget.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { parse as parseFrontmatterText } from '../packages/cli/src/frontmatter.mjs';

// The one case-pair the alphabet admits. Both are valid per ID_PATTERN.
const ID_UPPER = 'P-A234567A';
const ID_LOWER = 'P-a234567A';

function validFactOpts(overrides = {}) {
  return {
    tier: 'P',
    type: 'feedback',
    slug: 'sample',
    title: 'Sample fact',
    body: 'This is the body of the sample fact.',
    writeSource: 'user-explicit',
    trust: 'high',
    sourceFile: 'context/transcripts/2026-08-13.md',
    sourceLine: 1,
    sourceSha1: 'deadbeef0123456789abcdef0123456789abcdef',
    ...overrides,
  };
}

function tombDir(projectRoot) {
  return join(projectRoot, 'context', 'memory', 'archive', 'tombstones');
}

/** Is the filesystem under `dir` case-insensitive? */
function isCaseInsensitiveFs(dir) {
  const probe = join(dir, 'CmkCaseProbe.tmp');
  writeFileSync(probe, 'x', 'utf8');
  const insensitive = existsSync(join(dir, 'cmkcaseprobe.tmp'));
  rmSync(probe, { force: true });
  return insensitive;
}

describe('Task 281 — archive filenames survive a case-insensitive filesystem', () => {
  let sandbox;
  let projectRoot;

  beforeEach(() => {
    sandbox = mkdtempSync(join(tmpdir(), 'cmk-archive-case-'));
    projectRoot = join(sandbox, 'proj');
  });

  afterEach(() => {
    rmSync(sandbox, { recursive: true, force: true });
  });

  /* ---------------------------------------------------------------- */
  /* the shared helper's contract (Door 1 — response)                  */
  /* ---------------------------------------------------------------- */

  describe('archiveFileName / archiveIdFromFileName', () => {
    it('leaves an id with no lowercase letter byte-identical (the common case)', () => {
      // ~78% of ids contain no `a` at all; those names must not churn, or every
      // existing archive file would need a migration for a bug it cannot have.
      expect(archiveFileName(ID_UPPER)).toBe(`${ID_UPPER}.md`);
    });

    it('gives a case-pair of ids two names that differ under case folding', () => {
      const a = archiveFileName(ID_UPPER);
      const b = archiveFileName(ID_LOWER);
      expect(a).not.toBe(b);
      // The load-bearing assertion: DIFFERENT is not enough — they must still
      // be different once the filesystem folds case, or they collide anyway.
      expect(a.toLowerCase()).not.toBe(b.toLowerCase());
    });

    it('round-trips every name back to its exact id', () => {
      for (const id of [ID_UPPER, ID_LOWER, 'P-aaaaaaaa', 'U-ZZZZZZZZ', 'L-a2a3a4a5']) {
        expect(archiveIdFromFileName(archiveFileName(id))).toBe(id);
      }
    });

    it('still decodes a LEGACY raw-id name (existing corpora keep working)', () => {
      // Files already on disk are named `<id>.md` verbatim. Decoding must accept
      // them, or `cmk digest` loses every tombstone written before this fix.
      expect(archiveIdFromFileName(`${ID_LOWER}.md`)).toBe(ID_LOWER);
      expect(archiveIdFromFileName(`${ID_UPPER}.md`)).toBe(ID_UPPER);
    });

    it('returns null for a name that is not an archive fact file', () => {
      expect(archiveIdFromFileName('INDEX.md')).toBeNull();
      expect(archiveIdFromFileName('not-an-id.md')).toBeNull();
      expect(archiveIdFromFileName('P-A234567A.txt')).toBeNull();
    });

    it('never maps two distinct ids to the same case-folded name (sweep)', () => {
      // A property sweep over the whole alphabet in the position that matters,
      // rather than trusting the one hand-picked pair.
      const ALPHABET = '2345679ABCDEFGHJKLMNPQRSTUVWXYZa';
      const seen = new Map();
      for (const c of ALPHABET) {
        const id = `P-${c}2345679`;
        const folded = archiveFileName(id).toLowerCase();
        expect(seen.has(folded)).toBe(false);
        seen.set(folded, id);
      }
      expect(seen.size).toBe(ALPHABET.length);
    });
  });

  describe('archiveReadPath / archiveCandidatePaths', () => {
    it('resolves to the encoded file when one exists', () => {
      const dir = tombDir(projectRoot);
      mkdirSync(dir, { recursive: true });
      const encoded = join(dir, archiveFileName(ID_LOWER));
      writeFileSync(encoded, `---\nid: ${ID_LOWER}\n---\nbody\n`, 'utf8');
      expect(archiveReadPath(dir, ID_LOWER)).toBe(encoded);
    });

    it('falls back to a LEGACY raw-id file when no encoded file exists', () => {
      const dir = tombDir(projectRoot);
      mkdirSync(dir, { recursive: true });
      const legacy = join(dir, `${ID_LOWER}.md`);
      writeFileSync(legacy, `---\nid: ${ID_LOWER}\n---\nbody\n`, 'utf8');
      expect(archiveReadPath(dir, ID_LOWER)).toBe(legacy);
    });

    it('returns null when neither spelling exists', () => {
      const dir = tombDir(projectRoot);
      mkdirSync(dir, { recursive: true });
      expect(archiveReadPath(dir, ID_LOWER)).toBeNull();
    });

    it('lists BOTH spellings as purge candidates (purge means gone everywhere)', () => {
      const dir = tombDir(projectRoot);
      const candidates = archiveCandidatePaths(dir, ID_LOWER);
      expect(candidates).toContain(join(dir, archiveFileName(ID_LOWER)));
      expect(candidates).toContain(join(dir, `${ID_LOWER}.md`));
    });

    it('de-duplicates candidates when the two spellings coincide', () => {
      const dir = tombDir(projectRoot);
      // ID_UPPER has no `a`, so encoded === legacy; a purge must not try to
      // unlink the same path twice.
      const candidates = archiveCandidatePaths(dir, ID_UPPER);
      expect(candidates).toEqual([join(dir, `${ID_UPPER}.md`)]);
    });
  });

  /* ---------------------------------------------------------------- */
  /* the real bug, end-to-end (Door 2 — state on disk)                 */
  /* ---------------------------------------------------------------- */

  describe('forget() on a case-pair of ids', () => {
    it('the sandbox filesystem IS case-insensitive (guards the test itself)', () => {
      mkdirSync(projectRoot, { recursive: true });
      // If this ever fails, the regression below is vacuous on this machine and
      // the failure must say so rather than passing silently.
      expect(isCaseInsensitiveFs(projectRoot)).toBe(true);
    });

    it('writes TWO tombstone files, neither destroying the other', () => {
      const a = writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      const b = writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      expect(a.id).toBe(ID_UPPER);
      expect(b.id).toBe(ID_LOWER);

      const ra = forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'first', yes: true });
      const rb = forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'second', yes: true });

      // Door 1 — response
      expect(ra.action).toBe('tombstoned');
      expect(rb.action).toBe('tombstoned');

      // Door 2 — state: TWO files on disk, not one.
      const names = readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'));
      expect(names).toHaveLength(2);

      // and each is INTACT — the first tombstone's body was the casualty.
      const bodyOf = (id) => readFileSync(archiveReadPath(tombDir(projectRoot), id), 'utf8');
      expect(bodyOf(ID_UPPER)).toContain('UPPER fact body');
      expect(bodyOf(ID_LOWER)).toContain('lower fact body');

      // and each carries its OWN id in frontmatter.
      expect(parseFrontmatterText(bodyOf(ID_UPPER)).frontmatter.id).toBe(ID_UPPER);
      expect(parseFrontmatterText(bodyOf(ID_LOWER)).frontmatter.id).toBe(ID_LOWER);
    });

    it('resolveFact() reports BOTH as tombstoned, with their own bodies', () => {
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'first', yes: true });
      forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'second', yes: true });

      const fa = resolveFact({ id: ID_UPPER, projectRoot });
      const fb = resolveFact({ id: ID_LOWER, projectRoot });
      expect(fa.state).toBe('tombstoned');
      expect(fb.state).toBe('tombstoned');
      expect(fa.body).toContain('UPPER fact body');
      expect(fb.body).toContain('lower fact body');
      expect(fa.frontmatter.deleted_reason).toBe('first');
      expect(fb.frontmatter.deleted_reason).toBe('second');
    });

    it('resolveFact() still finds a LEGACY raw-named tombstone (backward compat)', () => {
      const dir = tombDir(projectRoot);
      mkdirSync(dir, { recursive: true });
      // Simulate a corpus written before this fix: raw-id filename.
      writeFileSync(
        join(dir, `${ID_LOWER}.md`),
        `---\nid: ${ID_LOWER}\ndeleted_at: 2026-08-01T00:00:00Z\ndeleted_reason: legacy\ndeleted_by: user\n---\nlegacy tombstone body\n`,
        'utf8',
      );
      const f = resolveFact({ id: ID_LOWER, projectRoot });
      expect(f.state).toBe('tombstoned');
      expect(f.body).toContain('legacy tombstone body');
    });
  });

  /* ---------------------------------------------------------------- */
  /* over-mutation guard                                               */
  /* ---------------------------------------------------------------- */

  describe('over-mutation guard', () => {
    it('forgetting one fact leaves every other fact and tombstone untouched', () => {
      const ids = ['P-A234567A', 'P-a234567A', 'P-B234567A', 'P-C234567A', 'P-D234567A'];
      ids.forEach((id, i) =>
        writeFact(validFactOpts({ projectRoot, id, slug: `s${i}`, body: `Body number ${i} for the over-mutation guard.` })),
      );
      // Tombstone two of them (including one half of the case-pair).
      forget({ idOrQuery: 'P-A234567A', projectRoot, reason: 'r1', yes: true });
      forget({ idOrQuery: 'P-a234567A', projectRoot, reason: 'r2', yes: true });

      // N-2 live facts remain, each with its own body.
      const factDir = join(projectRoot, 'context', 'memory');
      const live = readdirSync(factDir).filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md');
      expect(live).toHaveLength(3);
      for (const [i, id] of ids.entries()) {
        if (i < 2) continue;
        const f = resolveFact({ id, projectRoot });
        expect(f.state).toBe('live');
        expect(f.body).toContain(`Body number ${i}`);
      }
      // and both tombstones survived each other.
      expect(readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'))).toHaveLength(2);
    });
  });

  /* ---------------------------------------------------------------- */
  /* Door 5 — observability                                            */
  /* ---------------------------------------------------------------- */

  describe('audit log', () => {
    it('records a distinct tombstone entry per id, each naming its own path', () => {
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'first', yes: true });
      forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'second', yes: true });

      const auditPath = join(projectRoot, 'context', '.locks', 'audit.log');
      const entries = readFileSync(auditPath, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l))
        .filter((e) => e.action === 'tombstoned');

      const forId = (id) => entries.filter((e) => e.id === id);
      expect(forId(ID_UPPER).length).toBeGreaterThan(0);
      expect(forId(ID_LOWER).length).toBeGreaterThan(0);
      // The load-bearing assertion: the two ids must not have been logged
      // against ONE shared archive path. Before Task 281 both entries named the
      // same file, so the audit log — the trail an operator uses to prove a
      // forget happened — actively corroborated the destruction.
      const pathOf = (id) => forId(id).map((e) => e.paths?.archive).filter(Boolean)[0];
      expect(pathOf(ID_UPPER)).toBeTruthy();
      expect(pathOf(ID_LOWER)).toBeTruthy();
      expect(pathOf(ID_UPPER)).not.toBe(pathOf(ID_LOWER));
    });
  });
});
