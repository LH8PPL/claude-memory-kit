// @doors: 1, 2, 5
// Door 1 (response): runRegisterCrons' observable output IS its console
//   reporting + process.exitCode — both asserted here.
// Door 2 (state): the cron-registered sentinel writes are asserted via the
//   injected module seam (mocked), never against real project state. NOTHING in
//   this file touches a host scheduler: registerCron itself is mocked, so no
//   schtasks / crontab / launchctl process is ever created.
// Door 3 N/A: the spawn boundary is register-crons.mjs's own, pinned against the
//   real binaries + the spawn seam in tests/cli-register-crons.test.js. This
//   file covers the CLI layer ABOVE it, which spawns nothing itself.
// Door 4 N/A: no message-queue boundary.
// Door 5 (observability): Task 47.0 — the failed/succeeded settings repair now
//   appends a health-log entry, so the outcome outlives the console. The
//   appender is mocked here (it would otherwise write into THIS repo's own
//   dogfooded context/ tier, since the CLI resolves projectRoot from cwd); the
//   real on-disk append + its whisper/HC-14 consequence are pinned in
//   tests/cli-health-log.test.js and tests/cli-doctor-hc14.test.js.
//
// Task 265 (D-452): the +17 lines runRegisterCrons gained — the `settings:`
// print and the failed-repair warning — had no coverage. The warning is the
// part that matters: it is the ONLY thing standing between a user and a
// registered-but-starving scheduled task, and a silent regression there would
// restore exactly the false-green D-298 was.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the scheduler module so no real registration can occur and so each test
// can hand runRegisterCrons an arbitrary result shape (win32 or POSIX) without
// needing to BE on that platform.
vi.mock('../packages/cli/src/register-crons.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, registerCron: vi.fn(), unregisterCron: vi.fn() };
});

// Mock the sentinel writes so a non-dry-run test cannot touch the real cwd.
vi.mock('../packages/cli/src/lazy-compress.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, markCronRegistered: vi.fn(), unmarkCronRegistered: vi.fn() };
});

// Mock the health-log APPEND for the same reason: runRegisterCrons resolves
// projectRoot from cwd, and this repo dogfoods the kit — an unmocked append
// would write a real entry into the repo's own context/.locks/health.log.
// HEALTH_CODES stays real so the assertions below pin the actual code string.
vi.mock('../packages/cli/src/health-log.mjs', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, appendHealthEntry: vi.fn(() => ({ ok: true })) };
});

import { runRegisterCrons } from '../packages/cli/src/subcommands.mjs';
import { registerCron, unregisterCron } from '../packages/cli/src/register-crons.mjs';
import { appendHealthEntry, HEALTH_CODES } from '../packages/cli/src/health-log.mjs';

let logs;
let warns;
let logSpy;
let warnSpy;
let errSpy;
let priorExitCode;

/** A win32 result as registerCron really shapes it. */
function win32Result(over = {}) {
  return {
    action: 'registered',
    platform: 'win32',
    executed: true,
    command: 'schtasks /Create /TN cmk-daily-distill /SC DAILY /ST 23:00 /F',
    settingsCommand:
      'powershell -NoProfile -NonInteractive -Command "try { Set-ScheduledTask -TaskName \'cmk-daily-distill\' ' +
      '-Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable -WakeToRun -AllowStartIfOnBatteries ' +
      '-DontStopIfGoingOnBatteries -DontStopOnIdleEnd) -ErrorAction Stop | Out-Null } catch { exit 1 }"',
    settingsApplied: true,
    output: '',
    ...over,
  };
}

beforeEach(() => {
  logs = [];
  warns = [];
  priorExitCode = process.exitCode;
  logSpy = vi.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
  warnSpy = vi.spyOn(console, 'warn').mockImplementation((...a) => warns.push(a.join(' ')));
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  registerCron.mockReset();
  appendHealthEntry.mockClear();
});

afterEach(() => {
  logSpy.mockRestore();
  warnSpy.mockRestore();
  errSpy.mockRestore();
  process.exitCode = priorExitCode;
});

describe('Task 265 — `cmk register-crons` reporting', () => {
  it('prints the settings command so --dry-run is a COMPLETE account of the registration', () => {
    registerCron.mockImplementation(() => ({ ...win32Result(), action: 'dry-run', executed: false, settingsApplied: undefined }));
    runRegisterCrons({ dryRun: true });

    const out = logs.join('\n');
    // Both jobs reported, each with both halves of its registration.
    expect(out).toContain('daily-distill');
    expect(out).toContain('weekly-curate');
    expect(out.match(/^ {2}settings: /gm) ?? []).toHaveLength(2);
    expect(out).toContain('-AllowStartIfOnBatteries');
    expect(out).toContain('-DontStopIfGoingOnBatteries');
    expect(out).toContain('-DontStopOnIdleEnd');
    // A dry run applied nothing, so it must not warn about a failed apply.
    expect(warns).toHaveLength(0);
  });

  it('WARNS — naming the consequence and the repair — when the settings call failed', () => {
    registerCron.mockImplementation(() => win32Result({ settingsApplied: false }));
    runRegisterCrons({});

    expect(warns.join('\n')).toMatch(/battery/i);
    expect(warns.join('\n')).toMatch(/keyboard/i);
    expect(warns.join('\n')).toMatch(/cmk register-crons/);
    // One warning per affected job, not one for the pair.
    expect(warns).toHaveLength(2);
  });

  it('the failed repair does NOT fail the command — registration really did succeed', () => {
    // The lazy roll is the guarantee; a non-zero exit here would make an
    // install script treat a working registration as a failure.
    process.exitCode = undefined;
    registerCron.mockImplementation(() => win32Result({ settingsApplied: false }));
    runRegisterCrons({});
    expect(process.exitCode).toBeUndefined();
    expect(logs.join('\n')).toContain('registered on win32');
  });

  it('stays QUIET when the settings call succeeded (no warning on the happy path)', () => {
    registerCron.mockImplementation(() => win32Result({ settingsApplied: true }));
    runRegisterCrons({});
    expect(warns).toHaveLength(0);
    expect(logs.join('\n')).toContain('settings: ');
  });

  it('a POSIX result prints NEITHER line — the flags are a Windows concern only', () => {
    // Over-mutation guard for the reporting: the new branches must be inert on
    // every result that does not carry the fields, not merely on win32.
    registerCron.mockImplementation(() => ({
      action: 'registered',
      platform: 'linux',
      executed: true,
      command: "(crontab -l | grep -v 'cmk-daily-distill' ; echo '0 23 * * * node x') | crontab -",
      output: '',
    }));
    runRegisterCrons({});

    const out = logs.join('\n');
    expect(out).toContain('registered on linux');
    expect(out).not.toContain('settings: ');
    expect(warns).toHaveLength(0);
  });
});

// Task 47.0 (D-452 handover) — the console is not a durable surface.
//
// Task 265 made a failed settings repair VISIBLE; it did not make it
// DISCOVERABLE. The warning scrolls away, and `cmk doctor` HC-5 passed on the
// `cron-registered` sentinel alone, so a registered-but-starving task was
// invisible the moment the terminal moved on — the same heartbeat-not-outcome
// false-green D-298 was, one check over. The health log is the durable home:
// HC-14 and the per-prompt whisper both read it without either of them needing
// to know a thing about Task Scheduler.
describe('Task 47.0 — the settings-repair outcome is recorded durably', () => {
  it('appends a FAIL entry when the settings call did not apply (Door 5)', () => {
    registerCron.mockImplementation(() => win32Result({ settingsApplied: false }));
    runRegisterCrons({});

    const calls = appendHealthEntry.mock.calls.filter(
      (c) => c[1]?.class === HEALTH_CODES.CRON_SETTINGS_UNAPPLIED,
    );
    // One per affected job — the same granularity as the console warning.
    expect(calls).toHaveLength(2);
    for (const [root, entry] of calls) {
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
      expect(entry.outcome).toBe('fail');
      // A short machine token, never a message — DETAIL_TOKEN_PATTERN's contract.
      expect(entry.detail).toMatch(/^[a-z0-9._:-]{1,64}$/);
    }
  });

  it('appends an OK entry when the settings call landed — a success is what CLEARS the warning', () => {
    // D-412 is explicit that instrumented sites append BOTH outcomes. Without
    // the ok, a user who fixed the problem by re-running would keep the whisper
    // for a full freshness window, and the self-clean would not be structural.
    registerCron.mockImplementation(() => win32Result({ settingsApplied: true }));
    runRegisterCrons({});

    const calls = appendHealthEntry.mock.calls.filter(
      (c) => c[1]?.class === HEALTH_CODES.CRON_SETTINGS_UNAPPLIED,
    );
    expect(calls).toHaveLength(2);
    expect(calls.every(([, e]) => e.outcome === 'ok')).toBe(true);
  });

  it('records NOTHING on a dry run or on POSIX — there was no repair to have an outcome', () => {
    // Over-mutation guard for the instrumentation: the new append must be inert
    // wherever `settingsApplied` is absent, not merely off the win32 fail path.
    registerCron.mockImplementation(() => ({
      ...win32Result(),
      action: 'dry-run',
      executed: false,
      settingsApplied: undefined,
    }));
    runRegisterCrons({ dryRun: true });
    expect(appendHealthEntry).not.toHaveBeenCalled();

    appendHealthEntry.mockClear();
    registerCron.mockImplementation(() => ({
      action: 'registered',
      platform: 'linux',
      executed: true,
      command: "(crontab -l | grep -v 'cmk-daily-distill' ; echo '0 23 * * * node x') | crontab -",
      output: '',
    }));
    runRegisterCrons({});
    expect(appendHealthEntry).not.toHaveBeenCalled();
  });

  it('an unregister run records nothing — removing a task has no posture to report', () => {
    unregisterCron.mockImplementation(() => ({
      action: 'unregistered',
      platform: 'win32',
      executed: true,
      command: 'schtasks /Delete /TN "cmk-daily-distill" /F',
      output: '',
    }));
    runRegisterCrons({ unregister: true });
    expect(appendHealthEntry).not.toHaveBeenCalled();
  });
});
