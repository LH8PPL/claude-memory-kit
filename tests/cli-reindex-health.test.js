// @doors: 1, 2, 5
// Door 1: reindex() still returns its documented result shape.
// Door 2: the INDEX is rebuilt on disk (the thing that makes the warning stale).
// Door 5: the `index-drift: ok` health entry that CLEARS the warning.
// Door 3 N/A: reindex is in-process file scanning; no subprocess.
// Door 4 N/A: no message-queue surface.

// Tests for Task 250 review finding B1 — the whisper's own prescribed fix must
// actually clear the whisper.
//
// THE BUG THIS FILE EXISTS FOR. `index-drift`'s registry entry says
// `primaryAction: 'cmk reindex'`, and the troubleshooting skill tells the agent
// to run exactly that. But the only writer of `index-drift: ok` was writeFact's
// inline rebuild — `reindex.mjs` appended nothing. So the loop was:
//
//   whisper: "fix: cmk reindex"  →  agent runs `cmk reindex`  →  no ok lands
//   →  streak still reads 1 fail  →  whisper persists, for up to 7 days
//
// which is precisely the Tailscale #19241 stuck-warning class design §23 claims
// is structurally impossible — with the extra insult that the kit was telling
// the user to run the one command that could not help. The clear now lives in
// `reindex()` itself, so every route that rebuilds the INDEX resolves it.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { reindex } from '../packages/cli/src/reindex.mjs';
import { writeFact } from '../packages/cli/src/write-fact.mjs';
import {
  HEALTH_CODES,
  activeWarnings,
  healthLogPath,
  _resetHealthTransitionState,
} from '../packages/cli/src/health-log.mjs';

let sandbox;
let projectRoot;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-reindex-health-'));
  projectRoot = join(sandbox, 'proj');
  mkdirSync(join(projectRoot, 'context', 'memory'), { recursive: true });
  writeFileSync(join(projectRoot, 'context', 'MEMORY.md'), '# MEMORY\n', 'utf8'); // install marker
  _resetHealthTransitionState();
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

/** Seed the exact state a failed index rebuild leaves behind. */
function seedDriftWarning() {
  mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
  writeFileSync(
    healthLogPath(projectRoot),
    JSON.stringify({
      ts: new Date().toISOString(),
      schema: 1,
      class: HEALTH_CODES.INDEX_DRIFT,
      outcome: 'fail',
      detail: 'index-rebuild-failed',
    }) + '\n',
    'utf8',
  );
}

const baseFact = (over = {}) => ({
  tier: 'P',
  type: 'project',
  slug: 'a-fact',
  title: 'a fact',
  body: 'the body of a durable fact',
  writeSource: 'auto-extract',
  trust: 'high',
  sourceFile: 'test',
  sourceLine: 1,
  sourceSha1: 'a'.repeat(64),
  projectRoot,
  ...over,
});

describe('B1 — `cmk reindex` clears the warning it is prescribed for', () => {
  it('a seeded index-drift warning is ACTIVE before the fix runs', () => {
    seedDriftWarning();
    expect(activeWarnings(projectRoot, {}).map((w) => w.code)).toEqual([HEALTH_CODES.INDEX_DRIFT]);
  });

  it('running the REAL reindex clears it — the prescribed fix actually works', () => {
    seedDriftWarning();
    const r = reindex({ tier: 'P', projectRoot, warn: () => {} });
    expect(r.tier).toBe('P'); // Door 1: the contract is unchanged
    expect(existsSync(r.indexPath)).toBe(true); // Door 2: the INDEX really was rebuilt
    expect(activeWarnings(projectRoot, {})).toEqual([]); // Door 5: and the warning is gone
  });

  it('the whisper\'s primaryAction is the command that clears it (they cannot drift apart)', async () => {
    const { HEALTH_REGISTRY } = await import('../packages/cli/src/health-log.mjs');
    // If someone re-points index-drift at a different command, this fails —
    // which is the whole failure mode: a prescribed fix that does not fix.
    expect(HEALTH_REGISTRY[HEALTH_CODES.INDEX_DRIFT].primaryAction).toBe('cmk reindex');
  });

  it('a fact write that rebuilds the INDEX also clears it (the automatic route)', () => {
    seedDriftWarning();
    const r = writeFact(baseFact());
    expect(r.action).toBe('created');
    expect(activeWarnings(projectRoot, {})).toEqual([]);
  });

  it('FAIL then RECOVER in one process: the clearing ok is never suppressed as a repeat', () => {
    // The transition memory is per-process and shared between writeFact's fail
    // and reindex's ok. If the fail did not update that memory, a stale `ok`
    // entry would suppress the real one and strand the warning — B1 again, one
    // level in.
    const boom = () => {
      throw new Error('simulated killed rebuild');
    };
    writeFact(baseFact({ slug: 'f-one', title: 'f one', _reindexFn: boom }));
    expect(activeWarnings(projectRoot, {}).map((w) => w.code)).toEqual([HEALTH_CODES.INDEX_DRIFT]);

    reindex({ tier: 'P', projectRoot, warn: () => {} });
    expect(activeWarnings(projectRoot, {})).toEqual([]);
  });

  it('repeated reindexes in one process write ONE ok, not one per call (B2 cadence)', () => {
    for (let i = 0; i < 25; i++) reindex({ tier: 'P', projectRoot, warn: () => {} });
    const lines = readFileSync(healthLogPath(projectRoot), 'utf8').split(/\r?\n/).filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ class: HEALTH_CODES.INDEX_DRIFT, outcome: 'ok' });
  });

  it('a USER-TIER reindex (no project root) writes nothing and does not throw', () => {
    const userDir = join(sandbox, 'user-tier');
    mkdirSync(join(userDir, 'memory'), { recursive: true });
    expect(() => reindex({ tier: 'U', userDir, warn: () => {} })).not.toThrow();
    expect(existsSync(healthLogPath(projectRoot))).toBe(false);
  });
});
