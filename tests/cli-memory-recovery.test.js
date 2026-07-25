// @doors: 1, 2, 3, 5
// Door 1 (Response): scanStrayTiers / recoverMemory return shapes — which
//   tiers were found, what was recovered vs skipped vs repaired vs quarantined,
//   and the fail-open `{action:'error'}` contract.
// Door 2 (State): the whole point — which bytes land where on disk. Byte-for-byte
//   equality of recovered fact files (ids + created_at preserved), the husk left
//   untouched, the template-shaped decoy untouched, the over-mutation guard.
// Door 3 (External calls): the REAL `cmk install` bin driven as a subprocess
//   against a real temp project (the live-test rule) — an in-process install()
//   call cannot see the CLI wiring, the report rendering, or the exit code.
// Door 3.5 N/A: no LLM spawn on this path (recovery is zero-LLM by design).
// Door 4 N/A: no message queue.
// Door 5 (Observability): the audit log — every recovery/repair/quarantine
//   mutation appends an NDJSON entry to context/.locks/audit.log.

// Task 248 — install auto-recovers pre-existing orphaned memory tiers, and the
// same pass repairs malformed/id-less fact files (the D-394 scope note).
//
// The bug being recovered from: Task 246 (D-389) — the capture-hook bins passed
// bare process.cwd(), so an agent running from a SUBDIRECTORY forked a fresh,
// unread `context/` tier there. v0.6.2 stopped NEW strays; a user upgrading FROM
// a pre-246 version still has the old ones, frozen and unread. Recovery must be
// automatic (D-169 automatic-path criterion), byte-faithful (P-9W7XDMCA — a
// re-capture would re-date history), collision-safe, and it must NEVER delete a
// memory path (ADR-0018 / D-193 — the user deletes, the kit only hints).

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateId } from '@lh8ppl/cmk-canonicalize';
import {
  scanStrayTiers,
  recoverMemory,
  formatRecoveryReport,
  MAX_SCAN_DEPTH,
  QUARANTINE_DIRNAME,
} from '../packages/cli/src/memory-recovery.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { runDoctor } from '../packages/cli/src/doctor.mjs';
import { removeDir } from '../packages/cli/src/platform-commands.mjs';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const CMK_BIN = join(REPO, 'packages', 'cli', 'bin', 'cmk.mjs');

let sandbox;
let projectRoot;
let userDir;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-recovery-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  mkdirSync(projectRoot, { recursive: true });
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

/* ---------------------------------------------------------------- */
/* fixtures                                                          */
/* ---------------------------------------------------------------- */

// A fact file exactly as writeFact emits it: frontmatter then `\n<body>\n`.
function factText({ id, type = 'project', title = 'A stranded fact', createdAt, body }) {
  return (
    '---\n' +
    `id: ${id}\n` +
    `type: ${type}\n` +
    `title: ${title}\n` +
    `created_at: ${createdAt}\n` +
    'write_source: auto-extract\n' +
    'trust: high\n' +
    '---\n' +
    `\n${body}\n`
  );
}

// Plant a STRAY tier: a `context/` shaped dir below the project root carrying
// LIVE state (a non-empty sessions/now.md), the pre-246 fork's signature.
function plantStray(relDir, facts, { now = 'buffered turn text\n' } = {}) {
  const tierRoot = join(projectRoot, relDir, 'context');
  mkdirSync(join(tierRoot, 'memory'), { recursive: true });
  mkdirSync(join(tierRoot, 'sessions'), { recursive: true });
  writeFileSync(join(tierRoot, 'sessions', 'now.md'), now, 'utf8');
  for (const [filename, text] of Object.entries(facts)) {
    writeFileSync(join(tierRoot, 'memory', filename), text, 'utf8');
  }
  return tierRoot;
}

// Plant a TEMPLATE-SHAPED decoy: a scaffold with an unpopulated INDEX.md and
// an empty sessions/ — no live state, so it must never be treated as a stray.
function plantScaffold(relDir) {
  const tierRoot = join(projectRoot, relDir, 'context');
  mkdirSync(join(tierRoot, 'memory'), { recursive: true });
  mkdirSync(join(tierRoot, 'sessions'), { recursive: true });
  writeFileSync(
    join(tierRoot, 'memory', 'INDEX.md'),
    '# Granular memory index — project tier\n\n## Files\n\n',
    'utf8',
  );
  return tierRoot;
}

function rootFactDir() {
  return join(projectRoot, 'context', 'memory');
}

function seedRootTier() {
  mkdirSync(rootFactDir(), { recursive: true });
  mkdirSync(join(projectRoot, 'context', 'sessions'), { recursive: true });
  mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
}

function auditLines() {
  const p = join(projectRoot, 'context', '.locks', 'audit.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

function runInstallBin(extraEnv = {}) {
  return spawnSync(process.execPath, [CMK_BIN, 'install', '--no-hooks'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      MEMORY_KIT_USER_DIR: userDir,
      CMK_SKIP_UPDATE_CHECK: '1',
      ...extraEnv,
    },
    timeout: 120_000,
  });
}

/* ---------------------------------------------------------------- */
/* 1. the scan                                                       */
/* ---------------------------------------------------------------- */

describe('scanStrayTiers — the discriminator', () => {
  it('finds a stray tier carrying live state, and never the root tier itself', () => {
    seedRootTier();
    writeFileSync(join(rootFactDir(), 'project_root.md'), factText({
      id: 'P-AAAABBBB', createdAt: '2026-01-01T00:00:00Z', body: 'root fact',
    }), 'utf8');
    const stray = plantStray('packages/cli', {
      'project_stranded.md': factText({
        id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'stranded fact',
      }),
    });

    const r = scanStrayTiers({ projectRoot });
    expect(r.errors).toEqual([]);
    expect(r.strays.map((s) => s.tierRoot)).toEqual([stray]);
    expect(r.strays[0].tier).toBe('P');
    expect(r.strays[0].factCount).toBe(1);
  });

  it('does NOT flag a template-shaped scaffold (no live state)', () => {
    seedRootTier();
    plantScaffold('tools/scaffolds');
    const r = scanStrayTiers({ projectRoot });
    expect(r.strays).toEqual([]);
  });

  it('excludes node_modules, .git and dot-directories from the walk', () => {
    seedRootTier();
    plantStray('node_modules/somepkg', {
      'project_vendored.md': factText({ id: 'P-EEEEFFFF', createdAt: '2026-03-03T00:00:00Z', body: 'vendored' }),
    });
    plantStray('.git/weird', {
      'project_git.md': factText({ id: 'P-GGGGHHHH', createdAt: '2026-03-03T00:00:00Z', body: 'gitdir' }),
    });
    const r = scanStrayTiers({ projectRoot });
    expect(r.strays).toEqual([]);
  });

  it('is depth-bounded: a tier deeper than MAX_SCAN_DEPTH is not walked into', () => {
    seedRootTier();
    const tooDeep = Array.from({ length: MAX_SCAN_DEPTH + 1 }, (_, i) => `d${i}`).join('/');
    plantStray(tooDeep, {
      'project_deep.md': factText({ id: 'P-JJJJKKKK', createdAt: '2026-03-03T00:00:00Z', body: 'deep' }),
    });
    const r = scanStrayTiers({ projectRoot });
    expect(r.strays).toEqual([]);
  });

  it('fails OPEN: an unreadable candidate never throws, it reports', () => {
    seedRootTier();
    // `memory` is a FILE, not a directory — readdir throws ENOTDIR.
    const tierRoot = join(projectRoot, 'broken', 'context');
    mkdirSync(join(tierRoot, 'sessions'), { recursive: true });
    writeFileSync(join(tierRoot, 'sessions', 'now.md'), 'live\n', 'utf8');
    writeFileSync(join(tierRoot, 'memory'), 'not a directory', 'utf8');
    expect(() => scanStrayTiers({ projectRoot })).not.toThrow();
  });
});

/* ---------------------------------------------------------------- */
/* 2. recovery — faithful relocation                                 */
/* ---------------------------------------------------------------- */

describe('recoverMemory — byte-faithful relocation', () => {
  it('copies a stray fact into the root tier with ids + created_at byte-preserved', () => {
    seedRootTier();
    const text = factText({
      id: 'P-CCCCDDDD',
      createdAt: '2026-02-02T11:22:33Z',
      title: 'Stranded by the pre-246 fork',
      body: 'the stranded body',
    });
    const stray = plantStray('packages/cli', { 'project_stranded.md': text });

    const r = recoverMemory({ projectRoot, userDir });

    expect(r.action).toBe('completed');
    expect(r.strays).toHaveLength(1);
    expect(r.strays[0].recovered.map((f) => f.filename)).toEqual(['project_stranded.md']);
    const landed = join(rootFactDir(), 'project_stranded.md');
    expect(readFileSync(landed, 'utf8')).toBe(text);
    // the husk is left in place, untouched
    expect(readFileSync(join(stray, 'memory', 'project_stranded.md'), 'utf8')).toBe(text);
  });

  it('emits a PLATFORM-CORRECT delete hint and never deletes the husk', () => {
    seedRootTier();
    const stray = plantStray('packages/cli', {
      'project_stranded.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'x' }),
    });
    const r = recoverMemory({ projectRoot, userDir });
    expect(r.strays[0].deleteHint).toBe(removeDir(stray));
    expect(existsSync(stray)).toBe(true);
  });

  it('reindexes so a recovered fact is immediately listed in INDEX.md', () => {
    seedRootTier();
    plantStray('packages/cli', {
      'project_stranded.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'x' }),
    });
    recoverMemory({ projectRoot, userDir });
    expect(readFileSync(join(rootFactDir(), 'INDEX.md'), 'utf8')).toContain('P-CCCCDDDD');
  });

  it('counts non-fact surfaces as left-in-place, never merging them', () => {
    seedRootTier();
    const stray = plantStray('packages/cli', {
      'project_stranded.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'x' }),
    });
    writeFileSync(
      join(stray, 'MEMORY.md'),
      '## Active Threads\n\n- a stranded bullet (P-MMMMNNNN)\n- another one (P-PPPPQQQQ)\n',
      'utf8',
    );
    const r = recoverMemory({ projectRoot, userDir });
    expect(r.strays[0].nonFact.memoryBullets).toBe(2);
    expect(r.strays[0].nonFact.sessionFiles).toBe(1);
    // nothing merged into the root scratchpad
    expect(existsSync(join(projectRoot, 'context', 'MEMORY.md'))).toBe(false);
  });

  it('writes a Door-5 audit entry per recovered fact', () => {
    seedRootTier();
    plantStray('packages/cli', {
      'project_stranded.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'x' }),
    });
    recoverMemory({ projectRoot, userDir });
    const entries = auditLines().filter((e) => e.action === 'stray-recovered');
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe('P-CCCCDDDD');
    expect(entries[0].reasonCode).toBe('stray-tier-recovered');
    expect(entries[0].paths.after).toBe(join(rootFactDir(), 'project_stranded.md'));
  });
});

/* ---------------------------------------------------------------- */
/* 3. collision safety + over-mutation                               */
/* ---------------------------------------------------------------- */

describe('recoverMemory — collision safety', () => {
  it('SKIPS when the destination filename already exists, never overwriting', () => {
    seedRootTier();
    const rootText = factText({ id: 'P-AAAABBBB', createdAt: '2026-01-01T00:00:00Z', body: 'the root version' });
    writeFileSync(join(rootFactDir(), 'project_same.md'), rootText, 'utf8');
    plantStray('packages/cli', {
      'project_same.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'the stray version' }),
    });

    const r = recoverMemory({ projectRoot, userDir });
    expect(r.strays[0].recovered).toEqual([]);
    expect(r.strays[0].skipped).toEqual([
      expect.objectContaining({ filename: 'project_same.md', reason: 'filename-exists' }),
    ]);
    expect(readFileSync(join(rootFactDir(), 'project_same.md'), 'utf8')).toBe(rootText);
  });

  it('SKIPS when the fact id already exists at root under a different filename', () => {
    seedRootTier();
    writeFileSync(join(rootFactDir(), 'project_here.md'), factText({
      id: 'P-CCCCDDDD', createdAt: '2026-01-01T00:00:00Z', body: 'same id, different name',
    }), 'utf8');
    plantStray('packages/cli', {
      'project_there.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'the stray copy' }),
    });

    const r = recoverMemory({ projectRoot, userDir });
    expect(r.strays[0].recovered).toEqual([]);
    expect(r.strays[0].skipped[0].reason).toBe('id-exists');
    expect(existsSync(join(rootFactDir(), 'project_there.md'))).toBe(false);
  });

  it('SKIPS a fact the user already tombstoned — recovery must not resurrect a forget', () => {
    seedRootTier();
    const tombDir = join(rootFactDir(), 'archive', 'tombstones');
    mkdirSync(tombDir, { recursive: true });
    writeFileSync(join(tombDir, 'P-CCCCDDDD.md'), factText({
      id: 'P-CCCCDDDD', createdAt: '2026-01-01T00:00:00Z', body: 'forgotten on purpose',
    }), 'utf8');
    plantStray('packages/cli', {
      'project_ghost.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'the stray copy' }),
    });

    const r = recoverMemory({ projectRoot, userDir });
    expect(r.strays[0].recovered).toEqual([]);
    expect(r.strays[0].skipped[0].reason).toBe('id-exists');
    expect(existsSync(join(rootFactDir(), 'project_ghost.md'))).toBe(false);
  });

  it('OVER-MUTATION GUARD: recovering one fact leaves every other root fact byte-identical', () => {
    seedRootTier();
    const seeded = {};
    for (const [i, id] of ['P-AAAABBBB', 'P-BBBBCCCC', 'P-DDDDEEEE'].entries()) {
      const name = `project_seed${i}.md`;
      const text = factText({ id, createdAt: `2026-01-0${i + 1}T00:00:00Z`, body: `seed body ${i}` });
      writeFileSync(join(rootFactDir(), name), text, 'utf8');
      seeded[name] = text;
    }
    plantStray('packages/cli', {
      'project_new.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'the new one' }),
    });

    recoverMemory({ projectRoot, userDir });

    for (const [name, text] of Object.entries(seeded)) {
      expect(readFileSync(join(rootFactDir(), name), 'utf8')).toBe(text);
    }
    // N seeded + 1 recovered, and nothing else invented
    const facts = readdirSync(rootFactDir()).filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md');
    expect(facts.sort()).toEqual(
      ['project_new.md', 'project_seed0.md', 'project_seed1.md', 'project_seed2.md'],
    );
  });
});

/* ---------------------------------------------------------------- */
/* 4. idempotency                                                    */
/* ---------------------------------------------------------------- */

describe('recoverMemory — idempotency', () => {
  it('a second run over the same husk recovers nothing and reports nothing', () => {
    seedRootTier();
    plantStray('packages/cli', {
      'project_stranded.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'x' }),
    });

    const first = recoverMemory({ projectRoot, userDir });
    expect(first.strays[0].recovered).toHaveLength(1);
    expect(formatRecoveryReport(first).length).toBeGreaterThan(0);

    const second = recoverMemory({ projectRoot, userDir });
    // the husk still exists (we never delete), but nothing was actioned, so the
    // report is silent — a re-install must not re-nag. Doctor's HC-13 is the
    // standing advisory for the husk that remains.
    expect(second.strays.every((s) => s.recovered.length === 0)).toBe(true);
    expect(formatRecoveryReport(second)).toEqual([]);
    // and no duplicate copy landed
    const facts = readdirSync(rootFactDir()).filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md');
    expect(facts).toEqual(['project_stranded.md']);
  });

  // Self-review regression: the stray path COPIES, so a stray's unrepairable
  // file is seen again on EVERY install. Without a bytes-identity check it
  // quarantined a fresh `.1.md`, `.2.md`, … each run — unbounded growth inside
  // the very tier that is supposed to be safe.
  it('does NOT re-quarantine the same broken stray file on every run', () => {
    seedRootTier();
    plantStray('packages/cli', { 'project_broken.md': '---\nid: [unclosed\n---\n\nx\n' });

    recoverMemory({ projectRoot, userDir });
    recoverMemory({ projectRoot, userDir });
    const third = recoverMemory({ projectRoot, userDir });

    const qDir = join(rootFactDir(), 'archive', QUARANTINE_DIRNAME);
    expect(readdirSync(qDir)).toEqual(['project_broken.md']);
    expect(third.strays[0].skipped[0].reason).toBe('already-quarantined');
  });

  it('still gives a DIFFERENT broken file with the same name its own slot', () => {
    seedRootTier();
    plantStray('packages/cli', { 'project_broken.md': '---\nid: [unclosed\n---\n\nfirst\n' });
    recoverMemory({ projectRoot, userDir });
    // same filename, different bytes — must not be swallowed by the first
    writeFileSync(
      join(projectRoot, 'packages/cli', 'context', 'memory', 'project_broken.md'),
      '---\nid: [unclosed\n---\n\nsecond, quite different\n',
      'utf8',
    );
    recoverMemory({ projectRoot, userDir });

    const qDir = join(rootFactDir(), 'archive', QUARANTINE_DIRNAME);
    expect(readdirSync(qDir).sort()).toEqual(['project_broken.1.md', 'project_broken.md']);
  });
});

/* ---------------------------------------------------------------- */
/* 5. malformed / id-less fact files (the D-394 scope)               */
/* ---------------------------------------------------------------- */

describe('recoverMemory — malformed fact repair (D-394)', () => {
  it('repairs a MISSING id by recomputing it content-addressed, preserving every other byte', () => {
    seedRootTier();
    const body = 'a legacy fact whose frontmatter never carried an id';
    const original =
      '---\n' +
      'type: project\n' +
      'title: Legacy fact\n' +
      'created_at: 2026-06-14T23:35:00Z\n' +
      'write_source: manual-edit\n' +
      'trust: high\n' +
      '---\n' +
      `\n${body}\n`;
    writeFileSync(join(rootFactDir(), 'project_legacy.md'), original, 'utf8');

    const r = recoverMemory({ projectRoot, userDir });

    const expectedId = generateId('P', `\n${body}\n`);
    expect(r.repaired).toEqual([
      expect.objectContaining({ filename: 'project_legacy.md', id: expectedId, previousId: null }),
    ]);
    const after = readFileSync(join(rootFactDir(), 'project_legacy.md'), 'utf8');
    expect(after).toBe(`---\nid: ${expectedId}\n` + original.slice('---\n'.length));
  });

  it('repairs an INVALID id (outside the kit alphabet) and keeps the old one as legacy_id', () => {
    seedRootTier();
    const body = 'RESUME — a hand-written id that never matched ID_PATTERN';
    const original = factText({ id: 'P-RES031CG', createdAt: '2026-06-14T23:35:00Z', body }); // validate-test-ids: ignore
    writeFileSync(join(rootFactDir(), 'project_resume.md'), original, 'utf8');

    const r = recoverMemory({ projectRoot, userDir });

    const expectedId = generateId('P', `\n${body}\n`);
    expect(r.repaired[0].id).toBe(expectedId);
    expect(r.repaired[0].previousId).toBe('P-RES031CG'); // validate-test-ids: ignore
    const after = readFileSync(join(rootFactDir(), 'project_resume.md'), 'utf8');
    expect(after).toContain(`id: ${expectedId}\n`);
    expect(after).toContain('legacy_id: P-RES031CG\n'); // validate-test-ids: ignore
    // every other line survives verbatim
    expect(after).toContain('created_at: 2026-06-14T23:35:00Z\n');
    expect(after.endsWith(`\n${body}\n`)).toBe(true);
  });

  it('a repaired fact becomes indexable — it lands in INDEX.md', () => {
    seedRootTier();
    const body = 'a legacy fact whose frontmatter never carried an id';
    writeFileSync(
      join(rootFactDir(), 'project_legacy.md'),
      `---\ntype: project\ntitle: Legacy fact\ncreated_at: 2026-06-14T23:35:00Z\n---\n\n${body}\n`,
      'utf8',
    );
    recoverMemory({ projectRoot, userDir });
    expect(readFileSync(join(rootFactDir(), 'INDEX.md'), 'utf8'))
      .toContain(generateId('P', `\n${body}\n`));
  });

  it('QUARANTINES a file whose id is NOT derivable — bytes preserved, nothing deleted', () => {
    seedRootTier();
    const broken = '---\nid: [unclosed\n  yaml: :::\n---\n\nsomething\n';
    writeFileSync(join(rootFactDir(), 'project_broken.md'), broken, 'utf8');

    const r = recoverMemory({ projectRoot, userDir });

    const dest = join(rootFactDir(), 'archive', QUARANTINE_DIRNAME, 'project_broken.md');
    expect(r.quarantined).toEqual([
      expect.objectContaining({ filename: 'project_broken.md', to: dest }),
    ]);
    expect(readFileSync(dest, 'utf8')).toBe(broken);
    expect(existsSync(join(rootFactDir(), 'project_broken.md'))).toBe(false);
  });

  it('QUARANTINES an id-less file with an empty body (nothing to hash)', () => {
    seedRootTier();
    const empty = '---\ntype: project\ntitle: Empty\n---\n\n\n';
    writeFileSync(join(rootFactDir(), 'project_empty.md'), empty, 'utf8');
    const r = recoverMemory({ projectRoot, userDir });
    expect(r.quarantined[0].filename).toBe('project_empty.md');
    expect(readFileSync(join(rootFactDir(), 'archive', QUARANTINE_DIRNAME, 'project_empty.md'), 'utf8'))
      .toBe(empty);
  });

  it('repairs a malformed fact ON ITS WAY OUT of a stray tier, leaving the husk file untouched', () => {
    seedRootTier();
    const body = 'stranded AND id-less';
    const original = `---\ntype: project\ntitle: Both\ncreated_at: 2026-02-02T00:00:00Z\n---\n\n${body}\n`;
    const stray = plantStray('packages/cli', { 'project_both.md': original });

    const r = recoverMemory({ projectRoot, userDir });

    const expectedId = generateId('P', `\n${body}\n`);
    expect(r.strays[0].recovered[0].id).toBe(expectedId);
    expect(readFileSync(join(rootFactDir(), 'project_both.md'), 'utf8'))
      .toBe(`---\nid: ${expectedId}\n` + original.slice('---\n'.length));
    // the husk copy is NOT rewritten — we never mutate the tier the user will delete
    expect(readFileSync(join(stray, 'memory', 'project_both.md'), 'utf8')).toBe(original);
  });

  it('writes Door-5 audit entries for repair + quarantine', () => {
    seedRootTier();
    writeFileSync(
      join(rootFactDir(), 'project_legacy.md'),
      '---\ntype: project\ntitle: L\ncreated_at: 2026-06-14T23:35:00Z\n---\n\nbody text\n',
      'utf8',
    );
    writeFileSync(join(rootFactDir(), 'project_broken.md'), '---\nid: [unclosed\n---\n\nx\n', 'utf8');
    recoverMemory({ projectRoot, userDir });
    const actions = auditLines().map((e) => e.action);
    expect(actions).toContain('fact-id-repaired');
    expect(actions).toContain('fact-quarantined');
  });
});

/* ---------------------------------------------------------------- */
/* 6. fail-open on the install path                                  */
/* ---------------------------------------------------------------- */

describe('recoverMemory — fail-open', () => {
  it('returns an error result instead of throwing when the scan blows up', () => {
    seedRootTier();
    const r = recoverMemory({
      projectRoot,
      userDir,
      _scanFn: () => {
        throw new Error('boom');
      },
    });
    expect(r.action).toBe('error');
    expect(r.errors[0]).toContain('boom');
    expect(formatRecoveryReport(r)).toEqual([
      expect.stringContaining('memory recovery scan skipped'),
    ]);
  });
});

/* ---------------------------------------------------------------- */
/* 7. install integration (module boundary + the REAL bin)           */
/* ---------------------------------------------------------------- */

describe('cmk install auto-recovers — module boundary', () => {
  it('install() carries a recovery report and lands the stranded fact', async () => {
    const text = factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T11:22:33Z', body: 'stranded' });
    plantStray('packages/cli', { 'project_stranded.md': text });

    const result = await install({ projectRoot, userTier: userDir, noHooks: true });

    expect(result.recovery.action).toBe('completed');
    expect(result.recovery.strays[0].recovered).toHaveLength(1);
    expect(readFileSync(join(rootFactDir(), 'project_stranded.md'), 'utf8')).toBe(text);
    // recovery never turns into an install error
    expect(result.errors).toEqual([]);
  });

  it('a template-shaped decoy below the root is never recovered from', async () => {
    const decoy = plantScaffold('tools/scaffolds');
    const before = readFileSync(join(decoy, 'memory', 'INDEX.md'), 'utf8');
    const result = await install({ projectRoot, userTier: userDir, noHooks: true });
    expect(result.recovery.strays).toEqual([]);
    expect(readFileSync(join(decoy, 'memory', 'INDEX.md'), 'utf8')).toBe(before);
  });
});

describe('cmk install auto-recovers — the REAL bin (Door 3)', () => {
  it('recovers a planted pre-246 stray, preserves dates, prints the delete hint, and stays quiet on re-run', () => {
    const text = factText({
      id: 'P-CCCCDDDD',
      createdAt: '2026-02-02T11:22:33Z',
      title: 'Stranded by the pre-246 fork',
      body: 'the stranded body',
    });
    const stray = plantStray('packages/cli', { 'project_stranded.md': text });

    const first = runInstallBin();
    expect(first.status).toBe(0);
    expect(first.stdout).toContain('recovered');
    expect(first.stdout).toContain(removeDir(stray));

    // dates + ids byte-preserved through the real bin
    expect(readFileSync(join(rootFactDir(), 'project_stranded.md'), 'utf8')).toBe(text);
    // the husk is still there — the kit never deletes a memory path
    expect(existsSync(join(stray, 'memory', 'project_stranded.md'))).toBe(true);

    const second = runInstallBin();
    expect(second.status).toBe(0);
    expect(second.stdout).not.toContain('recovered');
    const facts = readdirSync(rootFactDir()).filter((n) => n.endsWith('.md') && n !== 'INDEX.md' && n !== 'MAP.md');
    expect(facts).toEqual(['project_stranded.md']);
  });

  it('an unreadable stray never breaks the install (fail-open, exit 0) but is NOT silent', () => {
    const tierRoot = join(projectRoot, 'broken', 'context');
    mkdirSync(join(tierRoot, 'sessions'), { recursive: true });
    writeFileSync(join(tierRoot, 'sessions', 'now.md'), 'live\n', 'utf8');
    writeFileSync(join(tierRoot, 'memory'), 'not a directory', 'utf8');

    const r = runInstallBin();
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('cmk install');
    // the dropped candidate is REPORTED — a scan error that silences both this
    // report and HC-13 about a tier that may hold real facts must not be quiet
    expect(r.stdout).toContain('could not complete');
    expect(r.stdout).toContain('Install itself completed normally');
  });
});

/* ---------------------------------------------------------------- */
/* 8. the doctor backstop (HC-13)                                    */
/* ---------------------------------------------------------------- */

describe('HC-13 — the stray-tier backstop', () => {
  it('WARNs naming the stray path, with `cmk install` as the recovery', async () => {
    seedRootTier();
    const stray = plantStray('packages/cli', {
      'project_stranded.md': factText({ id: 'P-CCCCDDDD', createdAt: '2026-02-02T00:00:00Z', body: 'x' }),
    });
    const r = await runDoctor({ projectRoot, userDir, registryFetcher: async () => null });
    const hc = r.checks.find((c) => c.id === 'HC-13');
    expect(hc).toBeDefined();
    expect(hc.status).toBe('warn');
    expect(hc.message).toContain(stray);
    expect(hc.recoveryCommand).toBe('cmk install');
  });

  it('PASSes on a clean project, and doctor now runs 13 checks', async () => {
    seedRootTier();
    const r = await runDoctor({ projectRoot, userDir, registryFetcher: async () => null });
    expect(r.checks).toHaveLength(13);
    expect(r.checks.find((c) => c.id === 'HC-13').status).toBe('pass');
  });
});
