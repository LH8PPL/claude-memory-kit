// @doors: 1, 2, 3
// Door 2 (state) is asserted through the injected `writeFile` seam only — the VBS
//   shim write (Task 215) and the settings repair (Task 265) are pinned by capturing
//   what WOULD be written/spawned. NO test ever mutates real host-scheduler state:
//   registration is dry-run or fake-spawn locked per the CLAUDE.md autopilot stop rule
//   ("anything that touches the user's system beyond the repo"). The real registration
//   is the maintainer's own step.
// Door 3 (external calls) is asserted via the injected `spawn` seam: the absolute
//   System32 schtasks.exe + its verbatim argv, and the follow-up PowerShell
//   Set-ScheduledTask argv (Task 167.E / 203 / 265). The real crontab/launchctl/
//   schtasks binaries are exercised by the maintainer at install (cross-OS CI
//   matrix is Task 40 / v0.1.x).
// Door 4 N/A: no message-queue interaction.
// Door 5 N/A: register-crons returns its result struct rather than emitting NDJSON.

// Tests for Task 33 — register-crons (T-028.2).
// Per tasks.md 33.4 #2:
//   - Test `register-crons` idempotency: re-run adds no duplicate entries (platform-specific check via --dry-run)
//
// Plus boundary tests on platform detection + dry-run output shape.

import { describe, it, expect } from 'vitest';
import {
  registerCron,
  unregisterCron,
  detectPlatform,
  buildWindowsSchtasks,
  buildWindowlessShim,
  buildWindowsSettingsPowerShell,
  inspectWindowsTaskSettings,
  WINDOWS_TASK_SETTINGS,
  WINDOWS_SETTINGS_SWITCHES,
  CRON_ENTRY_NAME,
  DEFAULT_SCHEDULE,
  WEEKLY_ENTRY_NAME,
} from '../packages/cli/src/register-crons.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const FIXTURE_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'fixtures', 'schtasks');
const readTaskXml = (name) => readFileSync(join(FIXTURE_DIR, name), 'utf8');

// D-341 (2026-07-18): SonarCloud's A3S context collector constant-folds
// fixture path literals THROUGH the source-under-test's
// `join(projectRoot, 'context', …)` calls (chasing callers into excluded test
// files) and opendir's the derived path on the Linux runner — crashing the
// whole scan with ENOENT. Proven by TWO experiments: the crash path FOLLOWED
// a fixture rename (proj→sandbox), and then followed it AGAIN through a
// map+join builder (sandbox→sbx-root) — the engine fully partial-evaluates
// string construction. So: any projectRoot fixture that flows into a
// dir-join must be a RUNTIME value the engine cannot statically know — a
// real temp dir (below). String-obfuscation alone is insufficient (folded).
// The argv/command-string fixtures keep the builder form (they never flow
// into a dir-join; only the projectRoot did).
const opaqueWinRoot = (...parts) => parts.map((p) => String(p)).join('\\');
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// A REAL directory: statically unknowable to the analyzer, existing at runtime.
const RUNTIME_ROOT = mkdtempSync(join(tmpdir(), 'cmk-cron-fixture-'));

describe('Task 33 — register-crons', () => {
  describe('detectPlatform', () => {
    it('returns process.platform', () => {
      expect(detectPlatform()).toBe(process.platform);
    });
  });

  describe('CRON_ENTRY_NAME constant', () => {
    it('is the single source of truth for the cmk-daily-distill identifier', () => {
      expect(CRON_ENTRY_NAME).toBe('cmk-daily-distill');
    });
  });

  describe('DEFAULT_SCHEDULE constant', () => {
    it('matches design §1.4: Daily 23:00', () => {
      expect(DEFAULT_SCHEDULE).toEqual({ hour: 23, minute: 0 });
    });
  });

  describe('Validation (Door 1)', () => {
    it('rejects missing command', () => {
      const r = registerCron({ dryRun: true });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects a command containing a single quote (Linux cron-line quoting contract)', () => {
      const r = registerCron({ command: "node 'x'.mjs", dryRun: true });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('ACCEPTS a command containing double quotes — the Windows path triple needs them (Task 109 / D-83)', () => {
      // The Windows command IS `"<node>" "<script>" "<projectRoot>"` — double
      // quotes are REQUIRED (paths with spaces). The old guard rejected them,
      // making cron un-registerable on Windows (the whole D-83 bug). The win32
      // path now execs schtasks via an args array, so the inner quotes are safe.
      const r = registerCron({ command: 'node "x".mjs', dryRun: true });
      expect(r.action).toBe('dry-run');
      expect(r.action).not.toBe('error');
    });

    it('rejects invalid hour (>23)', () => {
      const r = registerCron({
        command: 'node x.mjs',
        schedule: { hour: 25, minute: 0 },
        dryRun: true,
      });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('rejects invalid minute (>59)', () => {
      const r = registerCron({
        command: 'node x.mjs',
        schedule: { hour: 23, minute: 99 },
        dryRun: true,
      });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
    });

    it('accepts valid schedule', () => {
      const r = registerCron({
        command: 'node x.mjs',
        schedule: { hour: 12, minute: 30 },
        dryRun: true,
      });
      expect(r.action).toBe('dry-run');
    });
  });

  describe('dry-run mode (Door 1: returns platform-detected command without executing)', () => {
    it('returns action:dry-run + executed:false', () => {
      const r = registerCron({ command: 'node bin.mjs', dryRun: true });
      expect(r.action).toBe('dry-run');
      expect(r.executed).toBe(false);
      expect(r.platform).toBe(process.platform);
      expect(r.command).toBeTruthy();
    });

    it('platform-specific command output is correct shape', () => {
      const r = registerCron({ command: 'node bin.mjs', dryRun: true });
      if (process.platform === 'linux') {
        expect(r.command).toContain('crontab -l');
        expect(r.command).toContain('grep -v');
        expect(r.command).toContain(CRON_ENTRY_NAME);
        expect(r.command).toContain('crontab -');
      } else if (process.platform === 'darwin') {
        expect(r.command).toContain('LaunchAgents');
        expect(r.command).toContain(CRON_ENTRY_NAME);
        expect(r.command).toContain('launchctl');
        // The plist content is in r.output for darwin dry-run.
        expect(r.output).toContain('<?xml');
        expect(r.output).toContain('<plist');
        expect(r.output).toContain('com.cmk.cmk-daily-distill');
      } else if (process.platform === 'win32') {
        // Task 109: the win32 dry-run command is now a readable render of the
        // schtasks ARGV array (entryName is a bare element, not display-quoted).
        expect(r.command).toContain('schtasks');
        expect(r.command).toContain(`/TN ${CRON_ENTRY_NAME}`);
        expect(r.command).toContain('/SC DAILY');
        // Default schedule is 23:00 — verify it's formatted as HH:mm.
        expect(r.command).toContain('/ST 23:00');
        // /F flag is the Windows idempotency primitive.
        expect(r.command).toContain('/F');
      }
    });

    it('honors custom schedule', () => {
      const r = registerCron({
        command: 'node bin.mjs',
        schedule: { hour: 7, minute: 15 },
        dryRun: true,
      });
      if (process.platform === 'linux') {
        expect(r.command).toContain('15 7 * * *');
      } else if (process.platform === 'darwin') {
        expect(r.output).toContain('<key>Hour</key><integer>7</integer>');
        expect(r.output).toContain('<key>Minute</key><integer>15</integer>');
      } else if (process.platform === 'win32') {
        expect(r.command).toContain('/ST 07:15');
      }
    });
  });

  describe('33.4 #2 — idempotency: re-run produces same dry-run output', () => {
    it('two consecutive dry-runs produce identical commands (platform-specific)', () => {
      const r1 = registerCron({ command: 'node bin.mjs', dryRun: true });
      const r2 = registerCron({ command: 'node bin.mjs', dryRun: true });
      expect(r1.command).toBe(r2.command);
      // For Linux: the `grep -v <entry-name>` is the idempotency
      // primitive — the pipe pattern strips any pre-existing entry
      // before re-adding. Verify the command structure pins this.
      if (process.platform === 'linux') {
        expect(r1.command).toMatch(/grep -v '[^']*cmk-daily-distill[^']*'/);
      }
      // For Windows: the `/F` flag forces overwrite. Same primitive.
      if (process.platform === 'win32') {
        expect(r1.command).toContain('/F');
      }
      // For macOS: the plist write is naturally idempotent
      // (overwrite-existing); launchctl bootout + bootstrap handles
      // re-loading.
      if (process.platform === 'darwin') {
        expect(r1.command).toContain('launchctl bootstrap');
      }
    });
  });

  describe('unregisterCron dry-run', () => {
    it('returns action:dry-run with platform-correct unregistration command', () => {
      const r = unregisterCron({ dryRun: true });
      expect(r.action).toBe('dry-run');
      expect(r.executed).toBe(false);
      if (process.platform === 'linux') {
        expect(r.command).toContain('grep -v');
        expect(r.command).toContain(CRON_ENTRY_NAME);
        expect(r.command).toContain('crontab -');
      } else if (process.platform === 'darwin') {
        expect(r.command).toContain('launchctl bootout');
        expect(r.command).toContain('rm');
      } else if (process.platform === 'win32') {
        expect(r.command).toContain('schtasks /Delete');
        expect(r.command).toContain(CRON_ENTRY_NAME);
        expect(r.command).toContain('/F');
      }
    });
  });

  describe('Task 109 — Windows schtasks + macOS plist quoting (D-83 fix)', () => {
    // The REAL command: absolute node + script + projectRoot, each double-quoted
    // (paths have spaces). This quoted triple is what tripped the old guard.
    const winCommand =
      `"C:\\Program Files\\nodejs\\node.exe" "${opaqueWinRoot('C:', 'sbx-bin', 'cmk-daily-distill.mjs')}" "C:\\My Proj"`;

    it('buildWindowsSchtasks returns an ARGV array with /TR = the command VERBATIM (not a shell string)', () => {
      const argv = buildWindowsSchtasks({ command: winCommand, entryName: CRON_ENTRY_NAME, hour: 23, minute: 0 });
      expect(Array.isArray(argv)).toBe(true);
      expect(argv[0]).toBe('/Create');
      // The /TR value is ONE element, quotes intact — delivered to schtasks verbatim.
      const trIdx = argv.indexOf('/TR');
      expect(trIdx).toBeGreaterThan(0);
      expect(argv[trIdx + 1]).toBe(winCommand);
      // daily cadence + idempotency + non-admin run level.
      expect(argv).toContain('/SC');
      expect(argv).toContain('DAILY');
      expect(argv).toContain('/F');
      expect(argv).toContain('LIMITED');
    });

    it('Task 215: with a shimPath, /TR runs `wscript //B //Nologo "<shim>"` (no direct console binary → no window)', () => {
      // Fixture path deliberately avoids the repo's real dir names ("context",
      // ".locks"): SonarCloud's A3S Scan-Manifest context collector reads test
      // files IGNORING sonar.exclusions, extracts path-like literals that match
      // real project layout, and opendir's them on the Linux runner — the old
      // drive-letter fixture here (drive + proj + the context dir name) was the
      // trigger of the exit-3 scan crash that started the minute PR #278 merged
      // (D-341 root-cause correction, 2026-07-18; the literal itself is not
      // repeated in this comment for exactly that reason). The test's contract
      // (wscript //B //Nologo wrapping of an absolute Windows shim path) is
      // unchanged.
      const shimPath = 'C:\\shimdir\\cmk-daily-distill-run.vbs';
      const argv = buildWindowsSchtasks({ command: winCommand, entryName: CRON_ENTRY_NAME, hour: 23, minute: 0, shimPath });
      const trIdx = argv.indexOf('/TR');
      // The /TR is the wscript-shim launch, NOT the raw node command.
      expect(argv[trIdx + 1]).toBe(`wscript.exe //B //Nologo "${shimPath}"`);
      expect(argv[trIdx + 1]).not.toContain('node.exe'); // the console binary is inside the shim, hidden
    });

    it('Task 215: buildWindowlessShim wraps the command in a hidden WshShell.Run (windowStyle 0, wait True) with quotes escaped', () => {
      const vbs = buildWindowlessShim(`"C:\\node.exe" "C:\\x.mjs" "${opaqueWinRoot('C:', 'sbx')}"`);
      expect(vbs).toContain('CreateObject("WScript.Shell")');
      // windowStyle 0 = hidden; True = wait for exit (so the schtask's LastResult reflects the real run).
      expect(vbs).toMatch(/\.Run ".*", 0, True/);
      // VBS string-literal escaping: each embedded `"` becomes `""`.
      expect(vbs).toContain('""C:\\node.exe""');
      // The comment names itself so it's not a mystery file.
      expect(vbs).toContain('core-memory-kit');
    });

    it('weekly cadence emits /SC WEEKLY /D <DAY>', () => {
      const argv = buildWindowsSchtasks({ command: winCommand, entryName: WEEKLY_ENTRY_NAME, hour: 9, minute: 0, dayOfWeek: 0 });
      expect(argv).toContain('WEEKLY');
      const dIdx = argv.indexOf('/D');
      expect(dIdx).toBeGreaterThan(0);
      expect(argv[dIdx + 1]).toBe('SUN');
    });

    it('registerCron(platform:win32) dry-runs the quoted triple WITHOUT rejecting it', () => {
      const r = registerCron({ command: winCommand, platform: 'win32', dryRun: true });
      expect(r.action).toBe('dry-run'); // NOT 'error' — the D-83 bug
      expect(r.platform).toBe('win32');
      expect(r.command).toContain('schtasks');
      expect(r.command).toContain('/TR');
    });

    it('registerCron(platform:win32) execs the ABSOLUTE System32 schtasks.exe with verbatim argv (Door 3)', () => {
      const calls = [];
      const fakeSpawn = (exe, args, opts) => {
        calls.push({ exe, args, opts });
        return { status: 0, stdout: 'SUCCESS: created', stderr: '' };
      };
      const r = registerCron({ command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', spawn: fakeSpawn });
      expect(r.action).toBe('registered');
      expect(r.executed).toBe(true);
      // The FIRST spawn is the schtasks /Create (167.E adds a 2nd PS call after).
      const captured = calls.find((c) => /schtasks\.exe$/i.test(c.exe));
      expect(captured).toBeDefined();
      // Door 3 — the spawned program is the ABSOLUTE System32 schtasks.exe, not a
      // bare PATH name (PATH-hijack guard, Sonar S4036).
      expect(captured.exe).toMatch(/[\\/]System32[\\/]schtasks\.exe$/i);
      // …and the /TR triple is delivered verbatim (the D-83 fix).
      const trIdx = captured.args.indexOf('/TR');
      expect(captured.args[trIdx + 1]).toBe(winCommand);
      expect(captured.opts.windowsHide).toBe(true);
      expect(captured.opts.timeout).toBe(10_000);
    });

    it('Task 215: with a projectRoot, registerCron WRITES the windowless shim and points /TR at it (Door 2 + Door 3)', () => {
      const writes = [];
      const fakeSpawn = () => ({ status: 0, stdout: 'SUCCESS', stderr: '' });
      const r = registerCron({
        command: winCommand,
        entryName: CRON_ENTRY_NAME,
        platform: 'win32',
        projectRoot: RUNTIME_ROOT,
        spawn: fakeSpawn,
        writeFile: (path, content) => writes.push({ path, content }),
      });
      expect(r.action).toBe('registered');
      // Door 2: the shim file was written under the gitignored .locks dir.
      const shimWrite = writes.find((w) => w.path.endsWith(`${CRON_ENTRY_NAME}-run.vbs`));
      expect(shimWrite).toBeDefined();
      expect(shimWrite.path).toContain('.locks');
      expect(shimWrite.content).toContain('WScript.Shell');
      expect(shimWrite.content).toMatch(/\.Run ".*", 0, True/);
    });

    it('Task 215: a shim-write FAILURE falls back to the direct command (never fails registration)', () => {
      const fakeSpawn = () => ({ status: 0, stdout: 'SUCCESS', stderr: '' });
      const calls = [];
      const r = registerCron({
        command: winCommand,
        entryName: CRON_ENTRY_NAME,
        platform: 'win32',
        projectRoot: RUNTIME_ROOT,
        spawn: (exe, args) => { calls.push({ exe, args }); return fakeSpawn(); },
        writeFile: () => { throw new Error('read-only disk'); },
      });
      expect(r.action).toBe('registered'); // NOT error — the fallback path
      // The /TR reverted to the direct command (visible window, but functional).
      const captured = calls.find((c) => /schtasks\.exe$/i.test(c.exe));
      const trIdx = captured.args.indexOf('/TR');
      expect(captured.args[trIdx + 1]).toBe(winCommand); // direct, not the wscript shim
    });

    it('registerCron(platform:win32) reports action:error when schtasks exits non-zero', () => {
      const fakeSpawn = () => ({ status: 1, stdout: '', stderr: 'ERROR: Access is denied.' });
      const r = registerCron({ command: winCommand, platform: 'win32', spawn: fakeSpawn });
      expect(r.action).toBe('error');
      expect(r.error).toContain('schtasks exit 1');
      expect(r.output).toContain('Access is denied');
    });

    it('Task 167.E: after a successful /Create, sets StartWhenAvailable via a best-effort PowerShell call (OS catch-up for a missed run)', () => {
      // schtasks /Create has NO StartWhenAvailable flag (verified — not in the CLI
      // help); it's settable only via XML or PowerShell. So a missed nightly run
      // (laptop asleep at 23:00) is silently dropped by default. 167.E flips it on
      // best-effort with a follow-up Set-ScheduledTask call.
      const calls = [];
      const fakeSpawn = (exe, args) => {
        calls.push({ exe, args });
        return { status: 0, stdout: 'SUCCESS', stderr: '' };
      };
      const r = registerCron({ command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', spawn: fakeSpawn });
      expect(r.action).toBe('registered');
      // Two execs: the schtasks /Create, then the PowerShell StartWhenAvailable.
      const psCall = calls.find((c) => /powershell/i.test(c.exe) || c.args.some((a) => /StartWhenAvailable/i.test(a)));
      expect(psCall).toBeDefined();
      expect(psCall.args.some((a) => /StartWhenAvailable/i.test(a))).toBe(true);
      // Task 203 (D-298): WakeToRun is now ALSO set so the machine WAKES to run
      // the 23:00 distill instead of the cron being killed mid-run on a sleeping
      // laptop (the starvation bug). Same best-effort Set-ScheduledTask call.
      expect(psCall.args.some((a) => /WakeToRun/i.test(a))).toBe(true);
      expect(psCall.args.some((a) => a.includes(CRON_ENTRY_NAME))).toBe(true);
    });

    it('Task 167.E: a FAILED StartWhenAvailable call does NOT fail registration (best-effort backstop)', () => {
      // The lazy roll (167.A/D) is the guarantee; the catch-up flag is a best-effort
      // optimization. A PS failure must leave action:registered.
      let n = 0;
      const fakeSpawn = () => {
        n += 1;
        // First call (schtasks) succeeds; second call (PowerShell) fails.
        return n === 1 ? { status: 0, stdout: 'SUCCESS', stderr: '' } : { status: 1, stdout: '', stderr: 'PS boom' };
      };
      const r = registerCron({ command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', spawn: fakeSpawn });
      expect(r.action).toBe('registered'); // registration still succeeded
    });

    it('macOS strips the wrapping quotes so launchd execs a real path, not a literally-quoted one', () => {
      // No-space paths: the quote-strip fixes this common case (a space-bearing
      // path is the documented remaining edge needing the argv-array refactor).
      const cmd = '"/usr/local/bin/node" "/proj/bin/cmk-daily-distill.mjs" "/proj"';
      const r = registerCron({ command: cmd, platform: 'darwin', dryRun: true });
      expect(r.action).toBe('dry-run');
      expect(r.output).toContain('<string>/usr/local/bin/node</string>');
      expect(r.output).not.toMatch(/<string>"/); // no ProgramArgument starts with a literal quote
    });
  });
});

// ---------------------------------------------------------------------------
// Task 265 (D-424) — the scheduler flags that made D-298's starvation physical.
//
// The evidence (fixtures/schtasks/cmk-daily-distill-pre-265.xml, captured off a
// real machine): every task `register-crons` creates carried
//   DisallowStartIfOnBatteries=true  → never STARTS on battery
//   StopIfGoingOnBatteries=true      → KILLED the moment the user unplugs
//   StopOnIdleEnd=true               → killed when the idle condition ends
//   RestartOnIdle=false              → and never retried
// i.e. the whole Layer-6 maintenance tier was unreliable by construction on the
// hardware most users have. Verified against the Task Scheduler schema (schema
// defaults: DisallowStartIfOnBatteries/StopIfGoingOnBatteries/StopOnIdleEnd all
// default TRUE) AND empirically against `New-ScheduledTaskSettingsSet`, whose
// no-argument defaults reproduce the bad posture exactly — which is how the
// kit's OWN best-effort `Set-ScheduledTask` call (Task 167.E / 203) was itself
// re-stamping the hostile flags on every registration.
// ---------------------------------------------------------------------------
describe('Task 265 — the registered task must survive a developer laptop', () => {
  const winCommand = [
    `"${opaqueWinRoot('C', 'Program Files', 'nodejs', 'node.exe')}"`,
    `"${opaqueWinRoot('C', 'kit', 'bin', 'cmk-daily-distill.mjs')}"`,
    `"${opaqueWinRoot('C', 'proj')}"`,
  ].join(' ');

  describe('WINDOWS_TASK_SETTINGS — the desired posture (Door 1)', () => {
    it('declares the five flags that decide whether a nightly job actually runs', () => {
      expect(WINDOWS_TASK_SETTINGS).toEqual({
        // Pre-265, already correct (Task 167.E / D-207 + Task 203 / D-298):
        StartWhenAvailable: true, // a run missed while the machine was off catches up
        WakeToRun: true, // the machine wakes at 23:00 rather than skipping the run
        // Task 265 / D-424 — the three that made the job un-runnable on a laptop:
        DisallowStartIfOnBatteries: false, // an unplugged laptop must still distill
        StopIfGoingOnBatteries: false, // unplugging mid-run must not kill it
        StopOnIdleEnd: false, // returning to the keyboard must not kill it
      });
    });

    it('is frozen — the posture is a single source of truth, not a mutable default', () => {
      expect(Object.isFrozen(WINDOWS_TASK_SETTINGS)).toBe(true);
    });
  });

  describe('buildWindowsSettingsPowerShell — the Door 3 payload', () => {
    it('emits a switch for EVERY declared setting, and declares a setting for every switch', () => {
      // Both directions, per the validate-agent-adapter-parity discipline: a flag
      // added to the posture without a switch would silently never be applied, and
      // a switch with no declared setting would be an unexplained mutation.
      expect(Object.keys(WINDOWS_SETTINGS_SWITCHES).sort())
        .toEqual(Object.keys(WINDOWS_TASK_SETTINGS).sort());
      const ps = buildWindowsSettingsPowerShell(CRON_ENTRY_NAME);
      for (const sw of Object.values(WINDOWS_SETTINGS_SWITCHES)) {
        expect(ps).toContain(sw);
      }
    });

    it('carries the three Task-265 switches alongside the two pre-existing ones', () => {
      const ps = buildWindowsSettingsPowerShell(CRON_ENTRY_NAME);
      // Empirically verified on Windows PowerShell 5.1: this exact switch set
      // yields DisallowStartIfOnBatteries=False, StopIfGoingOnBatteries=False,
      // StopOnIdleEnd=False, StartWhenAvailable=True, WakeToRun=True.
      expect(ps).toContain('-AllowStartIfOnBatteries');
      expect(ps).toContain('-DontStopIfGoingOnBatteries');
      expect(ps).toContain('-DontStopOnIdleEnd');
      expect(ps).toContain('-StartWhenAvailable');
      expect(ps).toContain('-WakeToRun');
      expect(ps).toContain('New-ScheduledTaskSettingsSet');
      expect(ps).toContain('Set-ScheduledTask');
    });

    it('targets the named task and fails the whole script loudly rather than half-applying', () => {
      const ps = buildWindowsSettingsPowerShell(WEEKLY_ENTRY_NAME);
      expect(ps).toContain(`'${WEEKLY_ENTRY_NAME}'`);
      expect(ps).not.toContain(CRON_ENTRY_NAME);
      // -ErrorAction Stop + a catch that exits non-zero is what makes the caller's
      // settingsApplied flag meaningful (a silent partial apply would report true).
      expect(ps).toContain('-ErrorAction Stop');
      expect(ps).toMatch(/catch \{ exit 1 \}/);
    });

    it('does NOT set RestartOnIdle — with StopOnIdleEnd off there is nothing to restart', () => {
      // Decision trail: the task entry offered "set RestartOnIdle: true" as an
      // alternative. Rejected — MS docs are explicit that terminate-and-restart
      // needs BOTH StopOnIdleEnd AND RestartOnIdle true; not being killed at all
      // is strictly better than being killed and restarted from zero.
      expect(buildWindowsSettingsPowerShell(CRON_ENTRY_NAME)).not.toContain('-RestartOnIdle');
    });
  });

  describe('registerCron(win32) — the settings repair is issued on every registration (Door 3)', () => {
    const okSpawn = () => ({ status: 0, stdout: 'SUCCESS', stderr: '' });

    it('the PowerShell argv carries the battery + idle-end switches', () => {
      const calls = [];
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32',
        spawn: (exe, args) => { calls.push({ exe, args }); return okSpawn(); },
      });
      expect(r.action).toBe('registered');
      const psCall = calls.find((c) => /powershell\.exe$/i.test(c.exe));
      expect(psCall).toBeDefined();
      const script = psCall.args.join(' ');
      expect(script).toContain('-AllowStartIfOnBatteries');
      expect(script).toContain('-DontStopIfGoingOnBatteries');
      expect(script).toContain('-DontStopOnIdleEnd');
      // …without dropping what 167.E + 203 already earned.
      expect(script).toContain('-StartWhenAvailable');
      expect(script).toContain('-WakeToRun');
    });

    it('the settings repair runs on RE-registration too — that is the whole migration story', () => {
      // Existing installs carry the bad flags. There is no separate migration
      // command: `/Create /F` re-creates the task and the settings call re-stamps
      // it, so re-running `cmk register-crons` IS the repair. Pin that the repair
      // is unconditional on a successful create, not first-run-only.
      const scripts = [];
      for (let i = 0; i < 3; i += 1) {
        const calls = [];
        registerCron({
          command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32',
          spawn: (exe, args) => { calls.push({ exe, args }); return okSpawn(); },
        });
        const create = calls.find((c) => /schtasks\.exe$/i.test(c.exe));
        expect(create.args).toContain('/F'); // force-overwrite = idempotent re-create
        scripts.push(calls.find((c) => /powershell\.exe$/i.test(c.exe)).args.join(' '));
      }
      expect(new Set(scripts).size).toBe(1); // byte-identical every time
    });

    it('reports settingsApplied:true when the repair lands (Door 1)', () => {
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', spawn: okSpawn,
      });
      expect(r.action).toBe('registered');
      expect(r.settingsApplied).toBe(true);
    });

    it('reports settingsApplied:false — but stays action:registered — when the repair fails', () => {
      // The registration itself succeeded; the flags did not get fixed. Silently
      // swallowing that is how a user ends up with a registered-but-starving task
      // and no signal (the D-298 false-green class). Registration must not fail —
      // the lazy roll is the guarantee — but the outcome must be visible.
      let n = 0;
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32',
        spawn: () => { n += 1; return n === 1 ? okSpawn() : { status: 1, stdout: '', stderr: 'PS boom' }; },
      });
      expect(r.action).toBe('registered');
      expect(r.settingsApplied).toBe(false);
    });

    it('reports settingsApplied:false when the PowerShell spawn THROWS', () => {
      let n = 0;
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32',
        spawn: () => { n += 1; if (n === 1) return okSpawn(); throw new Error('no powershell'); },
      });
      expect(r.action).toBe('registered');
      expect(r.settingsApplied).toBe(false);
    });

    it('issues NO settings call when the /Create itself failed', () => {
      const calls = [];
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32',
        spawn: (exe, args) => { calls.push({ exe, args }); return { status: 1, stdout: '', stderr: 'denied' }; },
      });
      expect(r.action).toBe('error');
      expect(calls.filter((c) => /powershell\.exe$/i.test(c.exe))).toHaveLength(0);
    });
  });

  describe('--dry-run shows the EXACT registration, flags included (Door 1)', () => {
    it('win32 dry-run returns settingsCommand with every switch and spawns nothing (Door 3)', () => {
      const calls = [];
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', dryRun: true,
        spawn: (exe, args) => { calls.push({ exe, args }); return { status: 0 }; },
      });
      expect(r.action).toBe('dry-run');
      expect(r.executed).toBe(false);
      expect(calls).toHaveLength(0); // Door 3: nothing spawned
      expect(r.settingsCommand).toContain('-AllowStartIfOnBatteries');
      expect(r.settingsCommand).toContain('-DontStopIfGoingOnBatteries');
      expect(r.settingsCommand).toContain('-DontStopOnIdleEnd');
      expect(r.settingsCommand).toContain(CRON_ENTRY_NAME);
      // The schtasks half is unchanged and still shown.
      expect(r.command).toContain('/SC DAILY');
      // A dry run applied nothing, so it must not claim it did.
      expect(r.settingsApplied).toBeUndefined();
    });

    it('the dry-run settings command is byte-identical to what the real path spawns', () => {
      // Otherwise --dry-run is a lie: it would show one thing and register another.
      const calls = [];
      registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32',
        spawn: (exe, args) => { calls.push({ exe, args }); return { status: 0, stdout: 'SUCCESS', stderr: '' }; },
      });
      const spawnedScript = calls.find((c) => /powershell\.exe$/i.test(c.exe)).args.at(-1);
      const dry = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', dryRun: true,
      });
      expect(dry.settingsCommand).toContain(spawnedScript);
    });

    it('a win32 dry-run writes NOTHING to disk, yet still shows the shim it WOULD use (Door 2)', () => {
      // Found while wiring the flags into --dry-run: the win32 branch wrote the
      // VBS shim BEFORE the dry-run return, so `cmk register-crons --dry-run`
      // created context/.locks/ + a .vbs in the user's repo. A dry run that
      // mutates state cannot be the "inspect before granting host permissions"
      // affordance it is documented as (design §8.6.2).
      const writes = [];
      const sandbox = mkdtempSync(join(tmpdir(), 'cmk-cron-dryrun-'));
      const r = registerCron({
        command: winCommand, entryName: CRON_ENTRY_NAME, platform: 'win32', dryRun: true,
        projectRoot: sandbox,
        writeFile: (path, content) => writes.push({ path, content }),
      });
      expect(r.action).toBe('dry-run');
      expect(writes).toHaveLength(0);
      // …and the real filesystem is untouched too (the seam could be bypassed).
      expect(existsSync(join(sandbox, 'context', '.locks'))).toBe(false);
      // The DISPLAY must not regress: the user still sees the wscript shim /TR
      // they will actually get, not the direct command.
      expect(r.command).toContain('wscript.exe //B //Nologo');
      expect(r.command).toContain(`${CRON_ENTRY_NAME}-run.vbs`);
    });

    it('the POSIX legs carry no settingsCommand — the flags are a schtasks concern only', () => {
      for (const platform of ['linux', 'darwin']) {
        const r = registerCron({ command: 'node bin.mjs', platform, dryRun: true });
        expect(r.action).toBe('dry-run');
        expect(r.settingsCommand).toBeUndefined();
      }
    });
  });

  describe('inspectWindowsTaskSettings — the detection hook Task 47 will wire into HC-5 (Door 1)', () => {
    it('flags the REAL pre-265 task definition captured off a live machine', () => {
      const v = inspectWindowsTaskSettings(readTaskXml('cmk-daily-distill-pre-265.xml'));
      expect(v.verdict).toBe('needs-repair');
      const bad = v.problems.map((p) => p.setting).sort();
      expect(bad).toEqual([
        'DisallowStartIfOnBatteries', 'StopIfGoingOnBatteries', 'StopOnIdleEnd',
      ]);
      // StartWhenAvailable + WakeToRun already landed (167.E / 203) — not re-flagged.
      expect(bad).not.toContain('StartWhenAvailable');
      expect(bad).not.toContain('WakeToRun');
      // Each problem carries enough for a doctor message to be specific.
      const battery = v.problems.find((p) => p.setting === 'DisallowStartIfOnBatteries');
      expect(battery).toEqual({ setting: 'DisallowStartIfOnBatteries', actual: true, expected: false });
    });

    it('passes the repaired post-265 definition', () => {
      const v = inspectWindowsTaskSettings(readTaskXml('cmk-daily-distill-post-265.xml'));
      expect(v).toEqual({ verdict: 'ok', problems: [] });
    });

    it('treats an ABSENT element as its schema default, not as absent-so-fine', () => {
      // schtasks omits elements equal to the schema default, and those defaults are
      // exactly the hostile ones. Reading "absent" as "no problem" would false-green
      // the check on the very tasks it exists to catch.
      const bare = '<Task><Settings></Settings></Task>';
      const v = inspectWindowsTaskSettings(bare);
      expect(v.verdict).toBe('needs-repair');
      expect(v.problems.map((p) => p.setting).sort()).toEqual([
        'DisallowStartIfOnBatteries', 'StartWhenAvailable', 'StopIfGoingOnBatteries',
        'StopOnIdleEnd', 'WakeToRun',
      ]);
    });

    it('reports ONLY the setting that is wrong — the other four stay unreported (over-mutation guard)', () => {
      // Seed all five correct, break exactly one, assert 4 remain unflagged.
      const good = readTaskXml('cmk-daily-distill-post-265.xml');
      for (const [setting, expected] of Object.entries(WINDOWS_TASK_SETTINGS)) {
        const broken = good.replace(
          new RegExp(`<${setting}>[^<]*</${setting}>`),
          `<${setting}>${String(!expected)}</${setting}>`,
        );
        expect(broken).not.toBe(good); // the fixture really does declare it
        const v = inspectWindowsTaskSettings(broken);
        expect(v.verdict).toBe('needs-repair');
        expect(v.problems).toEqual([{ setting, actual: !expected, expected }]);
      }
    });

    it('returns verdict:unreadable — never a false needs-repair — for input it cannot parse', () => {
      for (const junk of ['', '   ', 'ERROR: The system cannot find the file specified.', null, undefined, 42]) {
        const v = inspectWindowsTaskSettings(junk);
        expect(v.verdict).toBe('unreadable');
        expect(v.problems).toEqual([]);
      }
    });

    it('tolerates the UTF-16 BOM + CRLF that `schtasks /query /XML` actually emits', () => {
      // D-306's class: the real payload is not the clean string a test invents.
      const raw = readTaskXml('cmk-daily-distill-pre-265.xml');
      const withBom = `﻿${raw.replace(/\n/g, '\r\n')}`;
      expect(inspectWindowsTaskSettings(withBom).verdict).toBe('needs-repair');
    });
  });

  // The unit tests above all call registerCron() in-process. This one drives the
  // REAL bin as a subprocess — the "unit-green ≠ works-on-real-input" gap the
  // live-test rule exists for. It is safe to run anywhere and in CI because
  // --dry-run registers nothing: the host scheduler is never touched, the run
  // happens in a throwaway cwd with MEMORY_KIT_USER_DIR isolated, and the
  // preceding Door-2 test pins that a dry run writes no files either.
  describe('live: the real `cmk register-crons --dry-run` bin', () => {
    it('prints the exact registration a user would get, flags included', () => {
      const sandbox = mkdtempSync(join(tmpdir(), 'cmk-cron-live-'));
      const userDir = mkdtempSync(join(tmpdir(), 'cmk-cron-userdir-'));
      const bin = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'packages', 'cli', 'bin', 'cmk.mjs');
      const out = execFileSync(process.execPath, [bin, 'register-crons', '--dry-run'], {
        cwd: sandbox,
        env: { ...process.env, MEMORY_KIT_USER_DIR: userDir },
        encoding: 'utf8',
        timeout: 30_000,
      });
      // Both jobs are shown, and neither was executed.
      expect(out).toContain('daily-distill');
      expect(out).toContain('weekly-curate');
      expect(out).toContain('dry-run');
      if (process.platform === 'win32') {
        // Task 265: the flags are visible in the dry run, per job.
        expect(out).toContain('-AllowStartIfOnBatteries');
        expect(out).toContain('-DontStopIfGoingOnBatteries');
        expect(out).toContain('-DontStopOnIdleEnd');
        expect(out.match(/-DontStopOnIdleEnd/g)).toHaveLength(2); // daily + weekly
        expect(out).toContain('/SC DAILY');
        expect(out).toContain('/SC WEEKLY');
        // Door 2: a dry run left no trace in the sandbox project.
        expect(existsSync(join(sandbox, 'context', '.locks'))).toBe(false);
      } else {
        expect(out).not.toMatch(/Batteries|IdleEnd|ScheduledTask/i);
      }
    });
  });

  describe('cross-platform: the POSIX legs have no equivalent posture to regress', () => {
    it('the linux cron line is a plain 5-field entry with no scheduler-posture machinery', () => {
      // cron has no battery or idle conditions to inherit; the only Windows-shaped
      // concept must not leak into the crontab pipe.
      const r = registerCron({ command: 'node bin.mjs', platform: 'linux', dryRun: true });
      expect(r.command).toMatch(/0 23 \* \* \* node bin\.mjs # cmk-daily-distill/);
      expect(r.command).not.toMatch(/Batteries|IdleEnd|ScheduledTask|powershell/i);
    });

    it('the macOS plist declares no battery/idle/throttling keys', () => {
      // launchd exposes no power- or user-activity-conditional keys at all (verified
      // against launchd.plist(5)); StartCalendarInterval already coalesces missed
      // runs to next wake, which is StartWhenAvailable's behaviour for free. Leaving
      // ProcessType unset keeps the job out of the throttled Background class.
      const r = registerCron({ command: '"/usr/bin/node" "/kit/bin/d.mjs" "/proj"', platform: 'darwin', dryRun: true });
      expect(r.output).toContain('<key>StartCalendarInterval</key>');
      expect(r.output).not.toMatch(/Batteries|IdleEnd|ProcessType|LowPriorityIO/i);
    });
  });
});
