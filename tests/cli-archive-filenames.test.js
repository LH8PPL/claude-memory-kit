// @doors: 1, 2, 5
// Door 3 N/A: archive filename derivation, tombstone moves and purge are
//   in-process file IO; no subprocess is spawned on any path under test.
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
// ── WHICH CI LEG RUNS WHICH LAYER (review finding B1) ────────────────────────
// This file has TWO layers, deliberately:
//
//   1. The FOLD-SIMULATION layer — pure functions over the helper's OUTPUT, with
//      case folding simulated IN-PROCESS (`fold()` below). It needs no
//      case-insensitive filesystem and therefore runs on EVERY CI leg, ubuntu
//      included. This is where the real regression protection lives: it proves
//      the id→filename map is injective under folding AND disjoint from every
//      legacy raw name, over a swept id space rather than one hand-picked pair.
//   2. The END-TO-END layer — real `forget` / `resolveFact` / `purgeHard` /
//      `recoverMemory` against a real archive directory. Its assertions are only
//      MEANINGFUL when the filesystem actually folds case, so each test in it is
//      gated on `CASE_INSENSITIVE_FS` and SKIPS with a named reason elsewhere.
//      In practice: runs on windows + macOS, skips on ubuntu.
//
// An earlier revision asserted `isCaseInsensitiveFs() === true` outright, which
// would have turned the ubuntu leg red at merge and tag time. The split keeps
// the guarantee without the false failure.
//
// Boundary-test discipline:
//   - Test the PUBLIC contract of the shared filename helper and of the surfaces
//     that consume it (forget / resolveFact / purgeHard / syncDecisionsJournal /
//     recoverMemory).
//   - The escape SPELLING is asserted in exactly one place (the encoding table)
//     because it is a documented on-disk format; everywhere else the assertions
//     are about the PROPERTY (fold-distinct, right id, other records untouched).

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
  archiveVerifiedPaths,
} from '../packages/cli/src/fact-store.mjs';
import { forget, resolveFact } from '../packages/cli/src/forget.mjs';
import { purgeHard } from '../packages/cli/src/redact.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import { syncDecisionsJournal } from '../packages/cli/src/decisions-journal.mjs';
import { recoverMemory } from '../packages/cli/src/memory-recovery.mjs';
import { parse as parseFrontmatterText } from '../packages/cli/src/frontmatter.mjs';

// The one case-pair the alphabet admits. Both are valid per ID_PATTERN.
const ID_UPPER = 'P-A234567A';
const ID_LOWER = 'P-a234567A';

const ALPHABET = '2345679ABCDEFGHJKLMNPQRSTUVWXYZa';

/**
 * Case folding as a case-insensitive filesystem performs it, simulated in
 * process. Windows/macOS compare filenames case-insensitively, so two names
 * with the same fold are the SAME FILE there. Lets the property layer run on a
 * case-sensitive filesystem (ubuntu CI) with no loss of rigour.
 */
const fold = (name) => name.toLowerCase();

/** The pre-Task-281 naming convention, still on disk in every older corpus. */
const legacyName = (id) => `${id}.md`;

/** Is the filesystem under `dir` case-insensitive? */
function isCaseInsensitiveFs(dir) {
  const probe = join(dir, 'CmkCaseProbe.tmp');
  writeFileSync(probe, 'x', 'utf8');
  const insensitive = existsSync(join(dir, 'cmkcaseprobe.tmp'));
  rmSync(probe, { force: true });
  return insensitive;
}

const CASE_INSENSITIVE_FS = (() => {
  const d = mkdtempSync(join(tmpdir(), 'cmk-case-detect-'));
  try {
    return isCaseInsensitiveFs(d);
  } finally {
    rmSync(d, { recursive: true, force: true });
  }
})();

// Gate for the end-to-end layer. `it.skip` carries the reason in the test name
// so a skipped ubuntu run says WHY rather than looking like a silent hole.
const itOnFoldingFs = CASE_INSENSITIVE_FS
  ? it
  : it.skip;
const FS_SKIP_NOTE =
  '[skipped on a case-SENSITIVE filesystem — the fold-simulation layer above covers this property everywhere]';

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

/** Write a tombstone file directly, at a chosen filename — the fixture for a
 *  corpus written BEFORE Task 281 (raw-id names). */
function seedTombstoneAt(dir, filename, id, body) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, filename),
    `---\nid: ${id}\ntype: project\ntitle: Seeded ${id}\ndeleted_at: 2026-08-01T00:00:00Z\ndeleted_reason: legacy\ndeleted_by: user-explicit\n---\n\n${body}\n`,
    'utf8',
  );
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

  /* ================================================================== */
  /* LAYER 1 — fold simulation. Runs on EVERY CI leg, ubuntu included.  */
  /* ================================================================== */

  describe('the encoding table (the documented on-disk format)', () => {
    it('escapes BOTH members of the case-pair, to distinct non-raw images', () => {
      // This is the one place the spelling is pinned. `a` -> `_a` AND `A` -> `_b`.
      // Escaping only `a` was not enough: it left every `A`-containing derived
      // name identical to a RAW name, which folds onto a legacy raw file for the
      // OTHER id — the review's finding I3.
      expect(archiveFileName('P-a2345679')).toBe('P-_a2345679.md');
      expect(archiveFileName('P-A2345679')).toBe('P-_b2345679.md');
      expect(archiveFileName(ID_UPPER)).toBe('P-_b234567_b.md');
      expect(archiveFileName(ID_LOWER)).toBe('P-_a234567_b.md');
    });

    it('leaves an id containing neither `a` nor `A` byte-identical', () => {
      // The common case (~60% of ids): no churn, no migration.
      expect(archiveFileName('P-BCDEFGHJ')).toBe('P-BCDEFGHJ.md');
      expect(archiveFileName('U-2345679Z')).toBe('U-2345679Z.md');
    });

    it('round-trips every derived name back to its exact id', () => {
      for (const id of [ID_UPPER, ID_LOWER, 'P-aaaaaaaa', 'P-AAAAAAAA', 'P-aAaAaAaA', 'U-ZZZZZZZZ', 'L-a2A3a4A5']) {
        expect(archiveIdFromFileName(archiveFileName(id))).toBe(id);
      }
    });

    it('still decodes a LEGACY raw-id name (existing corpora keep working)', () => {
      expect(archiveIdFromFileName(legacyName(ID_LOWER))).toBe(ID_LOWER);
      expect(archiveIdFromFileName(legacyName(ID_UPPER))).toBe(ID_UPPER);
    });

    it('returns null for a name that is not an archive fact file', () => {
      expect(archiveIdFromFileName('INDEX.md')).toBeNull();
      expect(archiveIdFromFileName('not-an-id.md')).toBeNull();
      expect(archiveIdFromFileName('P-A234567A.txt')).toBeNull();
      expect(archiveIdFromFileName('P-__a2345679.md')).toBeNull();
    });
  });

  describe('fold-injectivity of the DERIVED namespace (no filesystem needed)', () => {
    it('gives the case-pair two fold-distinct names', () => {
      expect(fold(archiveFileName(ID_UPPER))).not.toBe(fold(archiveFileName(ID_LOWER)));
    });

    it('never maps two distinct ids to one folded name — full alphabet sweep', () => {
      // Sweep the whole alphabet in a varying position, which is where the
      // case-pair hazard lives, rather than trusting one hand-picked pair.
      const seen = new Map();
      for (const c of ALPHABET) {
        for (const d of ALPHABET) {
          const id = `P-${c}23456${d}9`;
          const key = fold(archiveFileName(id));
          expect(seen.has(key)).toBe(false);
          seen.set(key, id);
        }
      }
      expect(seen.size).toBe(ALPHABET.length * ALPHABET.length);
    });

    it('an all-case-pair id space stays fold-distinct (the densest hazard)', () => {
      // Every id built only from `A`/`a` — the worst case, where every single
      // position is a folding collision under the raw naming.
      const ids = [];
      for (let n = 0; n < 64; n += 1) {
        let body = '';
        for (let bit = 0; bit < 6; bit += 1) body += (n >> bit) & 1 ? 'a' : 'A';
        ids.push(`P-${body}23`);
      }
      const seen = new Set(ids.map((id) => fold(archiveFileName(id))));
      expect(seen.size).toBe(ids.length);
    });
  });

  describe('fold-DISJOINTNESS from every legacy raw name (finding I3)', () => {
    it('a derived name never folds onto a DIFFERENT id\'s legacy raw name', () => {
      // The property that makes a legacy corpus safe to write into: a legacy
      // file can only ever be folded-hit by its OWN id's derived name.
      const ids = [];
      for (const c of ALPHABET) ids.push(`P-${c}2345679`, `P-A23456${c}9`, `P-a23456${c}9`);
      for (const x of ids) {
        for (const y of ids) {
          if (x === y) continue;
          expect(fold(archiveFileName(x))).not.toBe(fold(legacyName(y)));
        }
      }
    });

    it('specifically: the UPPER id\'s derived name does not fold onto the LOWER id\'s legacy file', () => {
      // The exact reproduction from the review: pre-fix this was an equality.
      expect(fold(archiveFileName(ID_UPPER))).not.toBe(fold(legacyName(ID_LOWER)));
      expect(fold(archiveFileName(ID_LOWER))).not.toBe(fold(legacyName(ID_UPPER)));
    });

    it('an id with no case-pair character still owns its own legacy name', () => {
      // Intentional: for such an id derived === legacy, so an existing file is
      // simply reused rather than orphaned. Safe because no OTHER id can fold
      // onto it (folding collides only on the {A,a} pair).
      const id = 'P-BCDEFGHJ';
      expect(fold(archiveFileName(id))).toBe(fold(legacyName(id)));
    });
  });

  /* ================================================================== */
  /* LAYER 2 — end-to-end. Meaningful only where the FS folds case.     */
  /* ================================================================== */

  describe('forget() on a case-pair of ids', () => {
    itOnFoldingFs(`writes TWO tombstone files, neither destroying the other ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));

      const ra = forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'first', yes: true });
      const rb = forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'second', yes: true });

      expect(ra.action).toBe('tombstoned');
      expect(rb.action).toBe('tombstoned');

      const names = readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'));
      expect(names).toHaveLength(2);

      const bodyOf = (id) => readFileSync(archiveReadPath(tombDir(projectRoot), id), 'utf8');
      expect(bodyOf(ID_UPPER)).toContain('UPPER fact body');
      expect(bodyOf(ID_LOWER)).toContain('lower fact body');
      expect(parseFrontmatterText(bodyOf(ID_UPPER)).frontmatter.id).toBe(ID_UPPER);
      expect(parseFrontmatterText(bodyOf(ID_LOWER)).frontmatter.id).toBe(ID_LOWER);
    });

    itOnFoldingFs(`resolveFact() reports BOTH as tombstoned, with their own bodies ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
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
    });
  });

  describe('a LEGACY corpus (raw-id archive names) — finding I3', () => {
    it('resolveFact() still finds a legacy raw-named tombstone', () => {
      seedTombstoneAt(tombDir(projectRoot), legacyName(ID_LOWER), ID_LOWER, 'legacy tombstone body');
      const f = resolveFact({ id: ID_LOWER, projectRoot });
      expect(f.state).toBe('tombstoned');
      expect(f.body).toContain('legacy tombstone body');
    });

    itOnFoldingFs(`forgetting the OTHER case-pair id does NOT overwrite the legacy tombstone ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      // The reviewer's reproduction. Pre-fix, `archiveFileName(ID_UPPER)` was
      // `P-A234567A.md`, which folds onto the legacy `P-a234567A.md` — so this
      // forget destroyed a DIFFERENT id's tombstone.
      seedTombstoneAt(tombDir(projectRoot), legacyName(ID_LOWER), ID_LOWER, 'PRE-EXISTING lower tombstone');
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));

      const r = forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'second forget', yes: true });
      expect(r.action).toBe('tombstoned');

      // the legacy tombstone survived, with ITS content
      const lower = resolveFact({ id: ID_LOWER, projectRoot });
      expect(lower.state).toBe('tombstoned');
      expect(lower.body).toContain('PRE-EXISTING lower tombstone');

      // and the new one is readable as itself
      const upper = resolveFact({ id: ID_UPPER, projectRoot });
      expect(upper.state).toBe('tombstoned');
      expect(upper.body).toContain('UPPER fact body');

      expect(readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'))).toHaveLength(2);
    });

    itOnFoldingFs(`a candidate holding the WRONG id reads as not-found, never as wrong content ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      // Damage already on disk from a pre-fix corpus: only ONE file exists under
      // a name that folds for both ids, and it holds the LOWER id. Asking for
      // the UPPER id must not hand back the lower id's fact — a never-forgotten
      // fact reading as deleted is the worst possible wrong answer here.
      seedTombstoneAt(tombDir(projectRoot), legacyName(ID_LOWER), ID_LOWER, 'lower content only');
      const upper = resolveFact({ id: ID_UPPER, projectRoot });
      expect(upper.state).toBe('not-found');
      // and the rightful owner still resolves
      expect(resolveFact({ id: ID_LOWER, projectRoot }).body).toContain('lower content only');
    });
  });

  /* ---------------------------------------------------------------- */
  /* purge — over-mutation guard (finding B2)                          */
  /* ---------------------------------------------------------------- */

  describe('purgeHard() over-mutation guard', () => {
    itOnFoldingFs(`purging one id leaves the OTHER case-pair id's tombstone intact ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      // Pre-fix, purge's candidate list contained the RAW spelling, which
      // case-folds onto the other id's file; existsSync said yes and purge
      // unlinked it irreversibly — both files gone.
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'a', yes: true });
      forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'b', yes: true });
      expect(readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'))).toHaveLength(2);

      const r = purgeHard({ id: ID_UPPER, yes: true, projectRoot });
      expect(r.action).not.toBe('error');

      // N-1: exactly one tombstone left, and it is the OTHER id, with its own body.
      const left = readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'));
      expect(left).toHaveLength(1);
      const survivor = resolveFact({ id: ID_LOWER, projectRoot });
      expect(survivor.state).toBe('tombstoned');
      expect(survivor.body).toContain('lower fact body');
      // and the purged one really is gone
      expect(resolveFact({ id: ID_UPPER, projectRoot }).state).toBe('not-found');
    });

    itOnFoldingFs(`...and in the OTHER direction — purging the LOWER id spares the UPPER ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      // The direction that actually reproduces B2: the LOWER id's LEGACY
      // candidate (`P-a234567A.md`) case-folds onto the UPPER id's derived file,
      // so an unverified existsSync+unlink destroyed a fact purge was never
      // asked to touch. Both directions are asserted because the candidate list
      // is asymmetric.
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'a', yes: true });
      forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'b', yes: true });

      purgeHard({ id: ID_LOWER, yes: true, projectRoot });

      const survivor = resolveFact({ id: ID_UPPER, projectRoot });
      expect(survivor.state).toBe('tombstoned');
      expect(survivor.body).toContain('UPPER fact body');
      expect(readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'))).toHaveLength(1);
    });

    itOnFoldingFs(`purging an id never unlinks a legacy file belonging to another id ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      seedTombstoneAt(tombDir(projectRoot), legacyName(ID_LOWER), ID_LOWER, 'legacy lower survives');
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'a', yes: true });

      purgeHard({ id: ID_UPPER, yes: true, projectRoot });

      const survivor = resolveFact({ id: ID_LOWER, projectRoot });
      expect(survivor.state).toBe('tombstoned');
      expect(survivor.body).toContain('legacy lower survives');
    });
  });

  /* ---------------------------------------------------------------- */
  /* over-mutation guard — the ordinary many-facts case                */
  /* ---------------------------------------------------------------- */

  describe('over-mutation guard', () => {
    it('forgetting one fact leaves every other fact and tombstone untouched', () => {
      const ids = ['P-A234567A', 'P-a234567A', 'P-B234567A', 'P-C234567A', 'P-D234567A'];
      ids.forEach((id, i) =>
        writeFact(validFactOpts({ projectRoot, id, slug: `s${i}`, body: `Body number ${i} for the over-mutation guard.` })),
      );
      forget({ idOrQuery: 'P-A234567A', projectRoot, reason: 'r1', yes: true });
      forget({ idOrQuery: 'P-a234567A', projectRoot, reason: 'r2', yes: true });

      const factDir = join(projectRoot, 'context', 'memory');
      const live = readdirSync(factDir).filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md');
      expect(live).toHaveLength(3);
      for (const [i, id] of ids.entries()) {
        if (i < 2) continue;
        const f = resolveFact({ id, projectRoot });
        expect(f.state).toBe('live');
        expect(f.body).toContain(`Body number ${i}`);
      }
      expect(readdirSync(tombDir(projectRoot)).filter((n) => n.endsWith('.md'))).toHaveLength(2);
    });
  });

  /* ---------------------------------------------------------------- */
  /* the decisions journal reads ids OUT of filenames (finding I4)     */
  /* ---------------------------------------------------------------- */

  describe('syncDecisionsJournal() — the real path, not a hand-built Set', () => {
    /** Seed a decision fact, journal it, then tombstone it at a chosen filename. */
    function seedJournaledDecision(id, filename) {
      writeFact(validFactOpts({
        projectRoot,
        id,
        type: 'project',
        slug: `dec-${id.slice(2, 6)}`,
        title: `Decision ${id}`,
        body: 'We decided to pin the runtime, because the CI leg and prod disagreed.',
        why: 'the legs disagreed',
      }));
      syncDecisionsJournal({ projectRoot });
      const live = readdirSync(join(projectRoot, 'context', 'memory'))
        .filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md');
      const factPath = join(projectRoot, 'context', 'memory', live.find((n) => readFileSync(join(projectRoot, 'context', 'memory', n), 'utf8').includes(`id: ${id}`)));
      const content = readFileSync(factPath, 'utf8');
      rmSync(factPath);
      mkdirSync(tombDir(projectRoot), { recursive: true });
      writeFileSync(join(tombDir(projectRoot), filename), content.replace('---\n', '---\ndeleted_at: 2026-08-02T00:00:00Z\n'), 'utf8');
    }

    it('excludes a decision whose tombstone carries the ESCAPED name', () => {
      // The masking pattern (Task 25): a test that builds the tombstoned-id Set
      // by hand cannot catch a filename-parse regression. This drives the real
      // sync, so the escaped name has to actually be understood.
      const id = 'P-a2345679';
      seedJournaledDecision(id, archiveFileName(id));
      const r = syncDecisionsJournal({ projectRoot });
      expect(r.written !== false || r.path).toBeTruthy();
      const journal = readFileSync(join(projectRoot, 'context', 'DECISIONS.md'), 'utf8');
      expect(journal).toMatch(new RegExp(`${id}[\\s\\S]{0,400}?(retracted|forgotten|deleted)`, 'i'));
    });

    it('excludes a decision whose tombstone carries a LEGACY raw name', () => {
      const id = 'P-a2345679';
      seedJournaledDecision(id, legacyName(id));
      syncDecisionsJournal({ projectRoot });
      const journal = readFileSync(join(projectRoot, 'context', 'DECISIONS.md'), 'utf8');
      expect(journal).toMatch(new RegExp(`${id}[\\s\\S]{0,400}?(retracted|forgotten|deleted)`, 'i'));
    });
  });

  /* ---------------------------------------------------------------- */
  /* the resurrection probe, automated (finding M7)                    */
  /* ---------------------------------------------------------------- */

  describe('recoverMemory() must not resurrect a forgotten case-pair fact', () => {
    /** A stray tier below the project root holding twins of both ids. */
    function seedStrayTwins() {
      const strayFactDir = join(projectRoot, 'sub', 'context', 'memory');
      mkdirSync(strayFactDir, { recursive: true });
      for (const [id, label] of [[ID_UPPER, 'upper'], [ID_LOWER, 'lower']]) {
        writeFileSync(
          join(strayFactDir, `project_stray-${label}.md`),
          `---\nid: ${id}\ntype: project\ntitle: STRAY twin ${label}\ncreated_at: 2026-08-13T12:00:00Z\nwrite_source: user-explicit\ntrust: high\n---\n\nSTRAY twin ${label} must not be resurrected.\n`,
          'utf8',
        );
      }
    }

    const liveIdsInRootTier = () => {
      const dir = join(projectRoot, 'context', 'memory');
      return readdirSync(dir)
        .filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md')
        .map((n) => parseFrontmatterText(readFileSync(join(dir, n), 'utf8')).frontmatter?.id)
        .filter(Boolean);
    };

    itOnFoldingFs(`neither forgotten id comes back when BOTH tombstones exist ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'a', yes: true });
      forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'b', yes: true });
      seedStrayTwins();

      recoverMemory({ projectRoot });

      const live = liveIdsInRootTier();
      expect(live).not.toContain(ID_UPPER);
      expect(live).not.toContain(ID_LOWER);
    });

    itOnFoldingFs(`DISCRIMINATING: destroying one tombstone DOES resurrect exactly that id ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
      // The D-451 probe, automated. Without this the test above could pass for
      // the wrong reason (e.g. the stray never being scanned at all), so the
      // negative result is only meaningful next to this positive control.
      writeFact(validFactOpts({ projectRoot, id: ID_UPPER, slug: 'upper', body: 'UPPER fact body, distinctly worded.' }));
      writeFact(validFactOpts({ projectRoot, id: ID_LOWER, slug: 'lower', body: 'lower fact body, distinctly worded.' }));
      forget({ idOrQuery: ID_UPPER, projectRoot, reason: 'a', yes: true });
      forget({ idOrQuery: ID_LOWER, projectRoot, reason: 'b', yes: true });

      // simulate the pre-fix state: the LOWER id's tombstone was destroyed
      rmSync(archiveReadPath(tombDir(projectRoot), ID_LOWER));
      seedStrayTwins();

      recoverMemory({ projectRoot });

      const live = liveIdsInRootTier();
      expect(live).toContain(ID_LOWER);   // the forget was undone
      expect(live).not.toContain(ID_UPPER); // control: still forgotten
    });
  });

  /* ---------------------------------------------------------------- */
  /* Door 5 — observability                                            */
  /* ---------------------------------------------------------------- */

  describe('audit log', () => {
    itOnFoldingFs(`records a distinct tombstone entry per id, each naming its own path ${CASE_INSENSITIVE_FS ? '' : FS_SKIP_NOTE}`, () => {
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

      const pathOf = (id) => entries.filter((e) => e.id === id).map((e) => e.paths?.archive).filter(Boolean)[0];
      expect(pathOf(ID_UPPER)).toBeTruthy();
      expect(pathOf(ID_LOWER)).toBeTruthy();
      expect(pathOf(ID_UPPER)).not.toBe(pathOf(ID_LOWER));
    });
  });

  /* ---------------------------------------------------------------- */
  /* archiveVerifiedPaths — the frontmatter-id gate (finding B2)       */
  /* ---------------------------------------------------------------- */

  describe('archiveVerifiedPaths / archiveReadPath verify the file OWNS the id', () => {
    it('rejects a candidate whose frontmatter id is a different fact', () => {
      const dir = tombDir(projectRoot);
      seedTombstoneAt(dir, legacyName(ID_LOWER), ID_LOWER, 'lower body');
      // ask for the UPPER id: on a folding FS this path resolves, but the file
      // belongs to the LOWER id, so it must not be returned.
      expect(archiveVerifiedPaths(dir, ID_UPPER)).toEqual([]);
      expect(archiveReadPath(dir, ID_UPPER)).toBeNull();
    });

    it('accepts a candidate whose frontmatter id matches', () => {
      const dir = tombDir(projectRoot);
      seedTombstoneAt(dir, legacyName(ID_LOWER), ID_LOWER, 'lower body');
      expect(archiveReadPath(dir, ID_LOWER)).toBe(join(dir, legacyName(ID_LOWER)));
      expect(archiveVerifiedPaths(dir, ID_LOWER)).toContain(join(dir, legacyName(ID_LOWER)));
    });

    it('returns nothing when neither spelling exists', () => {
      const dir = tombDir(projectRoot);
      mkdirSync(dir, { recursive: true });
      expect(archiveReadPath(dir, ID_LOWER)).toBeNull();
      expect(archiveVerifiedPaths(dir, ID_LOWER)).toEqual([]);
    });
  });
});
