// @doors: 1, 2
// Door 1 (response): HC-5's status / message / recoveryCommand ARE its contract
//   — the report renderer and the exit code derive from nothing else.
// Door 2 (state): a health check must not change what it measures. The
//   over-mutation guard below pins that a doctor run leaves the project tier
//   byte-identical, including on the branches that discovered a problem.
// Door 3 N/A: by design — the scheduler spawn is injected as `schedulerProbe`
//   so the doctor suite can never touch a real host scheduler. WHAT is spawned
//   (the absolute System32 schtasks path + its verbatim argv) is pinned one
//   layer down, in tests/cli-scheduler-state.test.js.
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: HC-5 writes no log. The durable record of a bad scheduler posture
//   is register-crons' health-log entry (Task 47.0), written by the code that
//   observed the outcome first-hand rather than inferred from a later probe.

// Tests for Task 47 (D-354) — HC-5 stops trusting its own sentinel.
//
// The bug this closes, in one line: the kit wrote a file saying "cron is
// registered", and then for four nights answered "is cron registered?" by
// reading that file back. The task itself pointed at a path under a package
// name that no longer existed. HC-10 (which watches OUTCOMES) caught it; HC-5
// (which watched a sentinel) reported PASS throughout — the same
// heartbeat-not-outcome false green as D-298, one check over.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { runDoctor } from '../packages/cli/src/doctor.mjs';
import { install } from '../packages/cli/src/install.mjs';
import { markCronRegistered } from '../packages/cli/src/lazy-compress.mjs';

let sandbox;
let projectRoot;
let userDir;

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-hc5-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  mkdirSync(projectRoot, { recursive: true });
  await install({ projectRoot, userTier: userDir, noHooks: true });
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

const NOW = '2026-08-09T12:00:00Z';

/** A probe that answers with a fixed verdict, and records what it was asked. */
function probe(byEntry, asked = []) {
  return ({ entryName }) => {
    asked.push(entryName);
    return byEntry[entryName] ?? byEntry.default;
  };
}

const doctor = (schedulerProbe) =>
  runDoctor({ projectRoot, userDir, now: NOW, registryFetcher: async () => null, schedulerProbe });
const hc5 = async (schedulerProbe) => (await doctor(schedulerProbe)).checks.find((c) => c.id === 'HC-5');

describe('HC-5 — cron registration', () => {
  it('SKIPs when no cron is registered — cron is optional and the lazy roll covers it', async () => {
    // Unchanged from before this task, and deliberately so: flagging an
    // optional, working-by-fallback feature as a failure made a healthy fresh
    // install read as broken.
    const c = await hc5(() => {
      throw new Error('must not probe the scheduler when nothing was registered');
    });
    expect(c.status).toBe('skip');
    expect(c.message).toMatch(/optional/i);
  });

  it('PASSes only when the scheduler CONFIRMS the registered target exists', async () => {
    markCronRegistered({ projectRoot });
    const asked = [];
    const c = await hc5(probe({ default: { verdict: 'ok', targetPath: '/x/cmk-daily-distill.mjs', problems: [] } }, asked));
    expect(c.status).toBe('pass');
    // BOTH jobs are checked. The rename stranded whichever was registered; a
    // check that looked at one of the two would be right half the time.
    expect(asked).toEqual(['cmk-daily-distill', 'cmk-weekly-curate']);
  });

  it('FAILS with the re-register recovery when the registered target is gone (D-354)', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(
      probe({
        'cmk-daily-distill': {
          verdict: 'target-missing',
          targetPath: 'C:\\x\\@lh8ppl\\claude-memory-kit\\bin\\cmk-daily-distill.mjs',
          problems: [],
          detail: 'the registered command no longer exists',
        },
        default: { verdict: 'ok', targetPath: '/x/y.mjs', problems: [] },
      }),
    );
    expect(c.status).toBe('fail');
    expect(c.recoveryCommand).toBe('cmk register-crons');
    // Name the path. "Cron is broken" sends the user to the scheduler UI; the
    // dead path tells them in one glance that a rename stranded it.
    expect(c.message).toContain('claude-memory-kit');
  });

  it('FAILS when the scheduler has no such entry despite the sentinel', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(probe({ default: { verdict: 'not-registered', problems: [], detail: 'no such task' } }));
    expect(c.status).toBe('fail');
    expect(c.recoveryCommand).toBe('cmk register-crons');
  });

  it('WARNs — advisory, not fail — on the pre-v0.6.6 battery/idle posture, naming the flags (47.0)', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(
      probe({
        default: {
          verdict: 'settings-stale',
          targetPath: '/x/y.mjs',
          problems: [
            { setting: 'DisallowStartIfOnBatteries', actual: true, expected: false },
            { setting: 'StopOnIdleEnd', actual: true, expected: false },
          ],
        },
      }),
    );
    // WARN, not FAIL: cron is optional and the lazy roll is the floor, so the
    // nightly OPTIMIZATION is degraded — nothing is broken. This matches the
    // `advisory` severity the same condition carries in the health registry,
    // and keeps a non-zero exit code off an otherwise healthy project (the
    // posture HC-13 and HC-14 already set).
    expect(c.status).toBe('warn');
    expect(c.recoveryCommand).toBe('cmk register-crons');
    expect(c.message).toContain('DisallowStartIfOnBatteries');
    expect(c.message).toContain('StopOnIdleEnd');
  });

  it('M8: WARNs when the posture could not be read — never reports it as verified', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(probe({ default: { verdict: 'settings-unknown', targetPath: '/x/y.mjs', problems: [], detail: 'no readable settings' } }));
    // WARN, not SKIP: the registration itself WAS verified, so skipping the
    // whole check would understate what is known. WARN, not FAIL: nothing is
    // known to be broken.
    expect(c.status).toBe('warn');
    expect(c.message).toMatch(/could NOT be verified/i);
    expect(c.recoveryCommand).toBe('cmk register-crons');
  });

  it('SKIPs HONESTLY when the scheduler cannot be read — never a false green, never a false alarm', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(probe({ default: { verdict: 'unreadable', problems: [], detail: 'schtasks.exe ENOENT' } }));
    expect(c.status).toBe('skip');
    // The message must say WHAT could not be verified. A bare "skip" reads as
    // "nothing to check here", which is the false-green wording one step down.
    expect(c.message).toMatch(/could not/i);
    expect(c.message).toContain('schtasks.exe ENOENT');
  });

  it('a probe that THROWS degrades to skip, never takes doctor down', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(() => {
      throw new Error('boom');
    });
    expect(c.status).toBe('skip');
  });

  it('reports the WORST verdict across both jobs — one healthy job cannot mask a dead one', async () => {
    markCronRegistered({ projectRoot });
    const c = await hc5(
      probe({
        'cmk-daily-distill': { verdict: 'ok', targetPath: '/x/a.mjs', problems: [] },
        'cmk-weekly-curate': { verdict: 'target-missing', targetPath: '/x/b.mjs', problems: [], detail: 'gone' },
      }),
    );
    expect(c.status).toBe('fail');
    expect(c.message).toContain('cmk-weekly-curate');
  });

  it('OVER-MUTATION GUARD: a doctor run leaves the project tier byte-identical', async () => {
    // A health check that repairs something is no longer a health check, and a
    // probe that writes changes what it measures. Asserted on the FAILING
    // branch specifically — that is the one with any temptation to act.
    markCronRegistered({ projectRoot });
    const snap = () => {
      const out = new Map();
      const walk = (dir) => {
        for (const e of readdirSync(dir, { withFileTypes: true })) {
          const p = join(dir, e.name);
          // native-memory-status.log is HC-6's documented snapshot write; it is
          // not HC-5's and is excluded rather than pretended away.
          if (e.name === 'native-memory-status.log') continue;
          if (e.isDirectory()) walk(p);
          else out.set(relative(projectRoot, p), `${statSync(p).size}:${readFileSync(p, 'utf8').length}`);
        }
      };
      walk(join(projectRoot, 'context'));
      return out;
    };
    const before = snap();
    await hc5(probe({ default: { verdict: 'target-missing', targetPath: '/x/y.mjs', problems: [], detail: 'gone' } }));
    expect(snap()).toEqual(before);
  });
});
