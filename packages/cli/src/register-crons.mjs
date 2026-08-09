// Cross-platform host-scheduler registration (Task 33.2, T-028).
//
// Composes the platform-native scheduler primitive on each OS so the
// daily-distill bin wrapper runs at 23:00 local time without users
// learning crontab / launchd / schtasks themselves.
//
// Per design §8.6.2:
//   Linux  → crontab pipe pattern (idempotent via grep -v + re-add)
//   macOS  → launchd plist + launchctl bootstrap
//   Windows → schtasks /Create /F (force-overwrite for idempotency)
//
// Per design §8.6.3:
//   Node, not Python. The kit is already Node-only; adding Python means
//   new test infra + install dep. spawnSync to the platform-native
//   scheduler binary is the established kit pattern (compressor.mjs,
//   capture-turn.mjs).
//
// Public boundary:
//   registerCron({command, options?}) → {action, platform, command,
//                                         executed, output, error?}
//   unregisterCron({options?})        → same shape
//   detectPlatform()                  → 'linux' | 'darwin' | 'win32'
//
// `options.dryRun: true` returns the platform-detected command WITHOUT
// executing — used by tests + by users who want to inspect before
// granting host permissions. Per the kit's autopilot stop boundary
// (CLAUDE.md Workflow): "anything that touches the user's system beyond
// the repo" requires user input. Defaults to dryRun=false; tests
// always pass dryRun=true.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { ERROR_CATEGORIES, errorResult } from './result-shapes.mjs';

// Canonical entry name across platforms. Used as the grep filter on
// Linux, the LaunchAgent label on macOS, the Task Scheduler name on
// Windows. Single source of truth — never construct ad-hoc names.
export const CRON_ENTRY_NAME = 'cmk-daily-distill';

// Task 34: second entry for weekly curate. Same naming convention.
export const WEEKLY_ENTRY_NAME = 'cmk-weekly-curate';

// Default schedule: 23:00 local time. Matches design §1.4 ("Daily 23:00
// scripts/run-daily-distill.sh") + tasks.md 33.
export const DEFAULT_SCHEDULE = { hour: 23, minute: 0 };

// Default weekly schedule: Sunday 09:00 local time. Matches design §1.4
// + tasks.md 34. dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday (cron + launchd convention).
export const DEFAULT_WEEKLY_SCHEDULE = { hour: 9, minute: 0, dayOfWeek: 0 };

// Map dayOfWeek (0-6, Sun=0) to schtasks /D abbreviation.
const WIN_DAY_MAP = { 0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT' };

// The entry-name charset, shared by every site that validates one. It is what
// makes an entryName safe to interpolate into a shell line, a plist label, a
// schtasks /TN and a single-quoted PowerShell string: no quote, no space, no
// metacharacter can appear. Single source so a widening here can never leave one
// site accepting what another rejects.
const ENTRY_NAME_PATTERN = /^[a-zA-Z0-9_.-]+$/;

// ---------------------------------------------------------------------------
// Task 265 (D-424) — the Windows Task Scheduler posture the kit's jobs need.
//
// SINGLE SOURCE OF TRUTH for what a cmk scheduled task must look like. Both the
// WRITE side (buildWindowsSettingsPowerShell → the registration's settings call)
// and the READ side (inspectWindowsTaskSettings → the doctor detection hook)
// derive from this object, so the two can never disagree about what "correct"
// means.
//
// WHY these five, and why the defaults are wrong for us. Task Scheduler's schema
// defaults (verified against the settingsType / idleSettingsType complex types)
// are DisallowStartIfOnBatteries=true, StopIfGoingOnBatteries=true,
// StopOnIdleEnd=true, StartWhenAvailable=false, WakeToRun=false — a posture
// designed for heavyweight maintenance on a desktop, and hostile to a ~1-minute
// memory-compression pass on a laptop. `New-ScheduledTaskSettingsSet` reproduces
// exactly those defaults, and `Set-ScheduledTask -Settings <set>` REPLACES the
// whole settings object — so the kit's own best-effort catch-up call (Task 167.E
// / 203) was re-stamping the hostile flags on every single registration. That is
// D-298's five-night starvation in configuration form (D-424).
//
// The evidence, read off a real machine and committed at
// fixtures/schtasks/cmk-daily-distill-pre-265.xml.
//
// Scope note: `RunOnlyIfIdle` is NOT in this set. It defaults to false and the
// captured task omits it, so the job never required an idle state to START —
// the entry's "10-minute idle requirement" reading was one step too far
// (`IdleSettings/Duration` and `WaitTimeout` are documented as DEPRECATED and
// "no longer used"). StopOnIdleEnd is still set explicitly here: the docs
// describe it as an unconditional "terminate if the idle condition ends" and do
// not condition it on RunOnlyIfIdle, so declaring it false removes the question
// rather than reasoning about it.
export const WINDOWS_TASK_SETTINGS = Object.freeze({
  // Task 167.E (D-207): a run missed while the machine was OFF runs on next wake.
  StartWhenAvailable: true,
  // Task 203 (D-298): the machine WAKES at 23:00 rather than skipping the run.
  WakeToRun: true,
  // Task 265 (D-424): a developer laptop is unplugged most of the time. A
  // memory-compression pass is light work — refusing to start on battery is
  // inherited boilerplate, never a considered choice for this job.
  DisallowStartIfOnBatteries: false,
  // Task 265 (D-424): unplugging mid-distill must not kill the run.
  StopIfGoingOnBatteries: false,
  // Task 265 (D-424): the user returning to the keyboard must not kill the run.
  // NB deliberately NOT paired with RestartOnIdle:true — the docs are explicit
  // that terminate-and-restart requires BOTH to be true, and not being killed is
  // strictly better than being killed and restarted from zero. The distill is
  // resumable (ADR-0020 / Task 204), which is the real backstop either way.
  StopOnIdleEnd: false,
});

// The `New-ScheduledTaskSettingsSet` switch that ACHIEVES each desired value.
// Every switch here flips its setting AWAY from the cmdlet default, which is why
// all five are always emitted. Parity with WINDOWS_TASK_SETTINGS is asserted
// both directions in tests/cli-register-crons.test.js — a setting added without
// a switch would silently never apply.
//
// @internal — exported ONLY so the parity + switch-binding tests can enumerate
// it. Not part of the module's supported surface: callers wanting the posture
// read WINDOWS_TASK_SETTINGS, callers wanting the command call
// buildWindowsSettingsPowerShell(). This mapping may change shape (e.g. if a
// setting ever needs a valued parameter rather than a switch) without notice.
export const WINDOWS_SETTINGS_SWITCHES = Object.freeze({
  StartWhenAvailable: '-StartWhenAvailable',
  WakeToRun: '-WakeToRun',
  DisallowStartIfOnBatteries: '-AllowStartIfOnBatteries',
  StopIfGoingOnBatteries: '-DontStopIfGoingOnBatteries',
  StopOnIdleEnd: '-DontStopOnIdleEnd',
});

// Task Scheduler schema defaults for the settings we care about — used by
// inspectWindowsTaskSettings when an element is ABSENT from a task definition.
// schtasks omits elements equal to the default, and three of those defaults are
// exactly the hostile values, so reading "absent" as "fine" would false-green
// the check on precisely the tasks it exists to catch.
const WINDOWS_SETTING_SCHEMA_DEFAULTS = Object.freeze({
  StartWhenAvailable: false,
  WakeToRun: false,
  DisallowStartIfOnBatteries: true,
  StopIfGoingOnBatteries: true,
  StopOnIdleEnd: true,
});

/**
 * Task 265: the PowerShell one-liner that applies WINDOWS_TASK_SETTINGS to an
 * already-created scheduled task.
 *
 * `schtasks /Create` has no CLI flag for any of these (verified — not in its
 * help); they are settable only via a full task XML or via PowerShell. We keep
 * the proven `schtasks /Create` + follow-up `Set-ScheduledTask` shape rather
 * than switching to `/Create /XML`: the XML route would mean authoring the
 * Principals / Triggers / Actions blocks by hand on a surface that cannot be
 * live-tested here (registering on the maintainer's machine is their own step),
 * and a malformed XML fails registration outright instead of degrading.
 *
 * `-ErrorAction Stop` + `catch { exit 1 }` is what makes the caller's
 * `settingsApplied` flag meaningful — without it a partial apply exits 0.
 *
 * @param {string} entryName  the task name; already validated against
 *   /^[a-zA-Z0-9_.-]+$/ at the registerCron boundary, so it cannot carry the
 *   quote that would break out of the single-quoted PowerShell string.
 * @returns {string} the `-Command` script
 */
export function buildWindowsSettingsPowerShell(entryName) {
  // The safety of the single-quoted `-TaskName '<entryName>'` below rests on the
  // charset. registerCron validates it before reaching here, but this function
  // is EXPORTED — so it carries its own contract rather than trusting that every
  // future caller happens to validate first.
  if (typeof entryName !== 'string' || !ENTRY_NAME_PATTERN.test(entryName)) {
    throw new Error(
      `buildWindowsSettingsPowerShell: entryName must match ${ENTRY_NAME_PATTERN} (got ${JSON.stringify(entryName)})`,
    );
  }
  const switches = Object.keys(WINDOWS_TASK_SETTINGS)
    .map((k) => WINDOWS_SETTINGS_SWITCHES[k])
    .join(' ');
  return (
    `try { Set-ScheduledTask -TaskName '${entryName}' ` +
    `-Settings (New-ScheduledTaskSettingsSet ${switches}) ` +
    `-ErrorAction Stop | Out-Null } catch { exit 1 }`
  );
}

/**
 * Task 265: does a registered Windows task carry the posture the kit needs?
 *
 * PURE — takes the text of a task definition, spawns nothing, touches no disk.
 * The I/O half (running `schtasks /query /TN <name> /XML ONE` and handing the
 * text here) belongs to the caller. This is deliberately the seam Task 47 wants:
 * that task already reads the same XML to check the registered TARGET still
 * exists, so HC-5 can read once and ask both questions.
 *
 * Caller note for that wiring: `schtasks /query /XML` emits UTF-16 with a BOM
 * and CRLF line endings. Decode it before calling; a leading BOM and CRLFs are
 * tolerated here regardless (the D-306 class).
 *
 * @param {string} xml  a Task Scheduler task definition
 * @returns {{verdict: 'ok'|'needs-repair'|'unreadable',
 *            problems: Array<{setting: string, actual: boolean, expected: boolean}>}}
 *   `unreadable` (never a false `needs-repair`) when the input is not a task
 *   definition — a doctor check must SKIP on "couldn't tell", not FAIL.
 */
export function inspectWindowsTaskSettings(xml) {
  if (typeof xml !== 'string' || !/<Settings[\s>]/.test(xml)) {
    return { verdict: 'unreadable', problems: [] };
  }
  const problems = [];
  for (const [setting, expected] of Object.entries(WINDOWS_TASK_SETTINGS)) {
    // Element names are unique across settingsType + idleSettingsType, so a flat
    // element match is unambiguous (StopOnIdleEnd nests under IdleSettings).
    // Deliberately no `\s*` around the capture: `\s*([^<]*?)\s*` is ambiguous
    // (whitespace matches both sides) — the polynomial-backtracking shape. One
    // greedy bounded class + trim() is unambiguous and does the same job.
    const m = new RegExp(`<${setting}>([^<]*)</${setting}>`).exec(xml);
    const actual = m ? m[1].trim().toLowerCase() === 'true' : WINDOWS_SETTING_SCHEMA_DEFAULTS[setting];
    if (actual !== expected) problems.push({ setting, actual, expected });
  }
  return { verdict: problems.length === 0 ? 'ok' : 'needs-repair', problems };
}

export function detectPlatform() {
  return process.platform; // 'linux' | 'darwin' | 'win32' (other: bsd etc.)
}

function buildLinuxCronLine({ command, entryName, hour, minute, dayOfWeek }) {
  // Standard 5-field cron syntax: minute hour day-of-month month day-of-week
  // The trailing `# <entry-name>` comment is what makes the entry
  // grep-able for idempotency + unregistration.
  // Task 34: dayOfWeek (0-6, Sun=0) optional. When set, restricts the
  // job to that weekday; when omitted, runs every day (`*`).
  const dow = dayOfWeek === undefined || dayOfWeek === null ? '*' : String(dayOfWeek);
  return `${minute} ${hour} * * ${dow} ${command} # ${entryName}`;
}

function macOsPlistPath(entryName) {
  return join(homedir(), 'Library', 'LaunchAgents', `com.cmk.${entryName}.plist`);
}

function buildMacOsPlist({ command, entryName, hour, minute, dayOfWeek }) {
  // Split command on whitespace for the ProgramArguments array.
  // launchd doesn't honor shell quoting — each arg is its own element.
  // Strip the surrounding double-quotes the caller wraps each path in (the
  // command is `"<node>" "<script>" "<projectRoot>"`): launchd execs the arg
  // LITERALLY, so a `<string>"/path/node"</string>` with quotes baked in is a
  // path that starts with `"` → ENOENT (Task 109: the macOS sibling of the
  // Windows D-83 bug). Each split token is one quoted path; drop the wrapping
  // quotes to get the clean path. (A path that itself contains a space is the
  // remaining edge — rare for node/project paths — and needs the argv-array
  // refactor noted in the Task 109 follow-up.)
  const args = command
    .split(/\s+/)
    .filter(Boolean)
    .map((a) => a.replace(/^"(.*)"$/, '$1'));
  const argXml = args
    .map((a) => `    <string>${escapeXml(a)}</string>`)
    .join('\n');
  const calendarLines = [
    `    <key>Hour</key><integer>${hour}</integer>`,
    `    <key>Minute</key><integer>${minute}</integer>`,
  ];
  if (dayOfWeek !== undefined && dayOfWeek !== null) {
    // launchd Weekday: 0=Sunday, 1=Monday, ..., 6=Saturday (same as cron).
    calendarLines.push(`    <key>Weekday</key><integer>${dayOfWeek}</integer>`);
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyLists-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    `  <key>Label</key><string>com.cmk.${entryName}</string>`,
    '  <key>ProgramArguments</key>',
    '  <array>',
    argXml,
    '  </array>',
    '  <key>StartCalendarInterval</key>',
    '  <dict>',
    ...calendarLines,
    '  </dict>',
    '  <key>RunAtLoad</key><false/>',
    '</dict>',
    '</plist>',
    '',
  ].join('\n');
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Task 215 (D-311): the VBS content that runs `command` with a HIDDEN window.
 * Task Scheduler launches a console binary (node.exe) in the interactive
 * session with a VISIBLE console window for the run's duration — a black box
 * popping over the user's screen nightly (verified: the real cmk-daily-distill
 * task registered LogonType=Interactive, Hidden=False). `wscript.exe` running
 * this VBS with WshShell.Run(cmd, 0, True) launches the command windowStyle=0
 * (hidden) and BLOCKS until it exits (True) — proven zero-flash on a real run
 * (2026-07-11 probe). No admin needed (S4U/session-0 requires elevation — a UAC
 * prompt we won't force), no per-install password.
 *
 * The command is embedded as a VBS double-quoted string literal ("" escapes a
 * quote inside VBS). command is kit-generated (node path + script + projectRoot,
 * each already quoted) — not user free-text — but we still escape defensively.
 */
export function buildWindowlessShim(command) {
  const vbsEscaped = String(command).replace(/"/g, '""');
  return [
    "' core-memory-kit — windowless launcher for the nightly memory-distill",
    "' scheduled task (Task 215 / D-311). Runs the distill with NO visible",
    "' console window. Safe to ignore; regenerated by `cmk register-crons`.",
    'Set sh = CreateObject("WScript.Shell")',
    `sh.Run "${vbsEscaped}", 0, True`,
    '',
  ].join('\r\n');
}

export function buildWindowsSchtasks({ command, entryName, hour, minute, dayOfWeek, shimPath }) {
  // Returns the schtasks.exe ARGV ARRAY (not a shell string). The /TR value — the
  // command to run, `"<node>" "<script>" "<projectRoot>"` with its own quotes
  // around each spaced path — is ONE array element, delivered to schtasks.exe
  // verbatim via CreateProcess (Node's Windows arg-quoting), with NO cmd.exe
  // re-parse at registration time.
  //
  // This is the D-83 fix. The old `/TR "${command}"` shell-string form double-
  // wrapped the inner quotes (schtasks AND cmd.exe both tried to parse them) and
  // the registerCron guard then rejected the inner `"` outright — so cron could
  // NEVER register on Windows. Array-exec sidesteps the nesting entirely: Task
  // Scheduler stores the /TR value and cmd.exe parses the quoted paths only when
  // the task FIRES. (No `\"`-escaping needed → no CodeQL js/incomplete-
  // sanitization, no path-corrupting backslash-doubling.)
  //
  // /ST is HH:mm; /F forces re-create for idempotency; /RL LIMITED (not HIGHEST)
  // because distill needs no admin. Task 34: /SC WEEKLY /D <SUN|...> for weekly.
  const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  let scheduleArgs;
  if (dayOfWeek !== undefined && dayOfWeek !== null) {
    const day = WIN_DAY_MAP[dayOfWeek];
    if (!day) {
      throw new Error(`buildWindowsSchtasks: invalid dayOfWeek ${dayOfWeek}`);
    }
    scheduleArgs = ['/SC', 'WEEKLY', '/D', day];
  } else {
    scheduleArgs = ['/SC', 'DAILY'];
  }
  // Task 215 (D-311): when a windowless shim path is provided, the /TR runs
  // `wscript.exe //B //Nologo "<shim>"` (batch mode, no logo) instead of node
  // directly — the shim launches the real command hidden, so no console window
  // ever appears. //B suppresses script errors/prompts to the console. Fallback:
  // no shim (macOS/Linux, or a shim-write failure) → the old direct command.
  const runTarget = shimPath
    ? `wscript.exe //B //Nologo ${quoteWinArg(shimPath)}`
    : command;
  return ['/Create', '/TN', entryName, ...scheduleArgs, '/ST', time, '/TR', runTarget, '/RL', 'LIMITED', '/F'];
}

/** Quote a Windows path for a /TR command string (wrap in double-quotes). */
function quoteWinArg(p) {
  return `"${String(p)}"`;
}

/**
 * Register a cron entry on the current platform.
 *
 * @param {object} opts
 * @param {string} opts.command  the command to run (typically a PATH-resolved bin name)
 * @param {string} [opts.entryName]  the entry identifier — defaults to CRON_ENTRY_NAME ('cmk-daily-distill')
 * @param {object} [opts.schedule]  {hour, minute, dayOfWeek?} — defaults to {23,0}; dayOfWeek (0-6, Sun=0) restricts to that weekday
 * @param {boolean} [opts.dryRun]  if true, return the command(s) without executing
 * @returns {object} {action, platform, executed, command, output, error?}
 */
export function registerCron(opts = {}) {
  const errors = [];
  if (!opts.command || typeof opts.command !== 'string') {
    errors.push('command: required, non-empty string');
  } else if (opts.command.includes("'")) {
    // Task 33 I1 fix — the Linux cron line interpolates `command`
    // into a single-quoted shell string (`echo '...'`). A command
    // with an embedded single quote would break the quoting + open
    // a shell-injection vector. Reject at the boundary; document
    // the contract. Future caller wanting single quotes in their
    // cron command needs to either escape POSIX-style ('\'') or
    // we extend this helper with a sanitizer (v0.1.x candidate).
    errors.push("command: must not contain single quotes (Linux cron-line shell-quoting contract)");
  }
  // NOTE (Task 109 / D-83): there is deliberately NO double-quote rejection. The
  // Windows command legitimately CONTAINS double-quotes — it's the quoted path
  // triple `"<node>" "<script>" "<projectRoot>"` (Task 36 B1/B2). The earlier
  // guard rejected `"` because the old `/TR "${command}"` SHELL form double-
  // wrapped them; that made cron un-registerable on Windows (the whole D-83 bug).
  // The win32 branch now execs schtasks with an ARGS ARRAY (no shell), so the
  // /TR value is delivered verbatim and the inner quotes never need escaping.
  // macOS XML-escapes them in the plist; Linux nests them inside its single-quote
  // `echo '...'` — so `"` is safe on every platform.
  const entryName = opts.entryName ?? CRON_ENTRY_NAME;
  if (!entryName || typeof entryName !== 'string' || !ENTRY_NAME_PATTERN.test(entryName)) {
    errors.push("entryName: must match /^[a-zA-Z0-9_.-]+$/ (used in shell + plist + schtasks identifiers)");
  }
  const {
    hour = DEFAULT_SCHEDULE.hour,
    minute = DEFAULT_SCHEDULE.minute,
    dayOfWeek,
  } = opts.schedule ?? {};
  if (
    !Number.isInteger(hour) || hour < 0 || hour > 23 ||
    !Number.isInteger(minute) || minute < 0 || minute > 59
  ) {
    errors.push('schedule: {hour: 0-23, minute: 0-59}');
  }
  if (dayOfWeek !== undefined && dayOfWeek !== null) {
    if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      errors.push('schedule.dayOfWeek: must be integer 0-6 (Sun=0)');
    }
  }
  if (errors.length > 0) {
    return errorResult({ category: ERROR_CATEGORIES.SCHEMA, errors });
  }

  // opts.platform is a test seam (detectPlatform() reads process.platform, which
  // can't vary on a single CI host) — production never passes it.
  const platform = opts.platform ?? detectPlatform();
  const dryRun = opts.dryRun === true;

  if (platform === 'linux') {
    const line = buildLinuxCronLine({ command: opts.command, entryName, hour, minute, dayOfWeek });
    // Idempotent: list current crontab, strip any pre-existing entry
    // by name, append the new line, pipe back.
    const shellCmd = `(crontab -l 2>/dev/null | grep -v '${entryName}' ; echo '${line}') | crontab -`;
    if (dryRun) {
      return {
        action: 'dry-run',
        platform,
        executed: false,
        command: shellCmd,
        output: '',
      };
    }
    // timeout: 10s — scheduler operations are fast; a hung crontab
    // command points at a broken host config and should fail loud.
    const r = spawnSync('bash', ['-c', shellCmd], { encoding: 'utf8', timeout: 10_000 });
    return {
      action: r.status === 0 ? 'registered' : 'error',
      platform,
      executed: true,
      command: shellCmd,
      output: (r.stdout || '') + (r.stderr || ''),
      ...(r.status === 0 ? {} : { error: `crontab exit ${r.status}` }),
    };
  }

  if (platform === 'darwin') {
    const plistPath = macOsPlistPath(entryName);
    const plistContent = buildMacOsPlist({ command: opts.command, entryName, hour, minute, dayOfWeek });
    if (dryRun) {
      return {
        action: 'dry-run',
        platform,
        executed: false,
        command: `write ${plistPath} (${plistContent.length} bytes) + launchctl bootstrap gui/$UID ${plistPath}`,
        output: plistContent,
      };
    }
    mkdirSync(dirname(plistPath), { recursive: true });
    writeFileSync(plistPath, plistContent, 'utf8');
    // bootout first (in case a stale entry exists), then bootstrap.
    // bootout exit code is non-zero if no entry is loaded — that's
    // fine, we ignore it.
    spawnSync('launchctl', ['bootout', `gui/${process.getuid?.() ?? ''}/com.cmk.${entryName}`], { encoding: 'utf8', timeout: 10_000 });
    const r = spawnSync('launchctl', ['bootstrap', `gui/${process.getuid?.() ?? ''}`, plistPath], { encoding: 'utf8', timeout: 10_000 });
    return {
      action: r.status === 0 ? 'registered' : 'error',
      platform,
      executed: true,
      command: `launchctl bootstrap gui/$UID ${plistPath}`,
      output: (r.stdout || '') + (r.stderr || ''),
      ...(r.status === 0 ? {} : { error: `launchctl exit ${r.status}` }),
    };
  }

  if (platform === 'win32') {
    // Task 215 (D-311): write a windowless VBS shim so the nightly task runs
    // with NO visible console window. Best-effort — if the shim can't be written
    // (no projectRoot, read-only dir), fall back to the direct command (the old
    // visible-window behavior) rather than fail registration. The shim lives in
    // context/.locks/ (gitignored, machine-local runtime plumbing).
    //
    // Task 265: the shim is only WRITTEN on a real registration. It used to be
    // written before the dry-run return, so `cmk register-crons --dry-run`
    // created `context/.locks/` + a `.vbs` in the user's repo — a dry run that
    // mutates state cannot be the "inspect before granting host permissions"
    // affordance design §8.6.2 documents. The path is still COMPUTED for the
    // dry run so the displayed /TR is the one the user will really get. (A dry
    // run therefore cannot predict a write FAILURE and its fallback to the
    // direct command; showing the intended shim beats writing a file.)
    let shimPath;
    if (opts.projectRoot && opts.writeShim !== false) {
      try {
        const locksDir = join(opts.projectRoot, 'context', '.locks');
        shimPath = join(locksDir, `${entryName}-run.vbs`);
        if (!dryRun) {
          mkdirSync(locksDir, { recursive: true });
          (opts.writeFile ?? writeFileSync)(shimPath, buildWindowlessShim(opts.command), 'utf8');
        }
      } catch {
        shimPath = undefined; // fall back to the direct (visible) command
      }
    }
    const argv = buildWindowsSchtasks({ command: opts.command, entryName, hour, minute, dayOfWeek, shimPath });
    const displayCmd = `schtasks ${argv.join(' ')}`; // informational (dry-run + result.command)
    // Task 265: registration is TWO steps, so --dry-run must show both or it is
    // showing the user something other than what it will do. The settings half is
    // built here from the same builder the exec path uses — one source, no drift.
    const settingsScript = buildWindowsSettingsPowerShell(entryName);
    // Displayed with a BARE `powershell` while the exec below resolves the
    // ABSOLUTE System32 path. That divergence is deliberate, not drift: the exec
    // must not be PATH-hijackable (Sonar S4036, same reason as schtasks.exe),
    // while this string exists to be READ and pasted by a human — an absolute
    // System32 path would only make it harder to use. The part that must not
    // diverge is the SCRIPT, and it cannot: both come from `settingsScript`,
    // and a test asserts the dry-run text contains exactly what gets spawned.
    const settingsCommand = `powershell -NoProfile -NonInteractive -Command "${settingsScript}"`;
    if (dryRun) {
      return {
        action: 'dry-run',
        platform,
        executed: false,
        command: displayCmd,
        settingsCommand,
        output: '',
      };
    }
    // Exec schtasks.exe with the ARGS ARRAY — NOT shell:true. This delivers the
    // /TR value's inner quotes to schtasks verbatim (CreateProcess arg-quoting),
    // never re-parsed by cmd.exe at registration time (the D-83 fix). Task
    // Scheduler stores the command; cmd.exe parses the quoted paths at fire time.
    // Resolve the ABSOLUTE System32 path rather than relying on PATH: schtasks
    // creates a scheduled task, so a PATH-hijacked `schtasks.exe` in a writable
    // dir would be a privilege-escalation vector (Sonar S4036). %SystemRoot% is
    // a fixed, unwriteable system directory.
    const schtasksExe = join(process.env.SystemRoot || process.env.windir || 'C:\\Windows', 'System32', 'schtasks.exe');
    // opts.spawn is a test seam (defaults to spawnSync): the real schtasks exec
    // can't run on a non-Windows CI host, so a fake lets the exec branch be
    // covered in-process AND asserts WHAT gets spawned (Door 3: the absolute
    // schtasks path + the verbatim argv). Production never passes it.
    const spawn = opts.spawn ?? spawnSync;
    const r = spawn(schtasksExe, argv, { encoding: 'utf8', windowsHide: true, timeout: 10_000 });

    // Apply WINDOWS_TASK_SETTINGS — the posture that decides whether this task
    // ever actually runs (Task 167.E/D-207 catch-up, Task 203/D-298 wake, Task
    // 265/D-424 battery + idle-end). See the constant for the full rationale.
    //
    // schtasks /Create has NO CLI flag for any of them, so this follow-up
    // PowerShell Set-ScheduledTask is the mechanism. It stays BEST-EFFORT: a
    // failure here never fails registration — the lazy roll (167.A/D) + the
    // resumable distill (204) are the guarantees, this is an optimization.
    //
    // Task 265 change: the outcome is no longer swallowed. A silently-failed
    // settings call leaves a registered-but-starving task with no signal, which
    // is the same false-green class as D-298's fresh-heartbeat/stale-output.
    // `settingsApplied` reports it without failing the registration.
    //
    // NB: WakeToRun waking a sleeping laptop nightly is a mild power tradeoff;
    // it's the standard Task Scheduler mechanism for "this job must run on
    // schedule even if asleep," appropriate for a once-a-day 23:00 maintenance
    // task.
    let settingsApplied;
    if (r.status === 0) {
      const psExe = join(
        process.env.SystemRoot || process.env.windir || 'C:\\Windows',
        'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe',
      );
      try {
        const ps = spawn(psExe, ['-NoProfile', '-NonInteractive', '-Command', settingsScript], {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 10_000,
        });
        settingsApplied = ps?.status === 0;
      } catch {
        // never let the settings call abort a successful registration
        settingsApplied = false;
      }
    }

    return {
      action: r.status === 0 ? 'registered' : 'error',
      platform,
      executed: true,
      command: displayCmd,
      ...(r.status === 0 ? { settingsCommand, settingsApplied } : {}),
      output: (r.stdout || '') + (r.stderr || ''),
      ...(r.status === 0 ? {} : { error: `schtasks exit ${r.status}` }),
    };
  }

  return errorResult({
    category: ERROR_CATEGORIES.SCHEMA,
    errors: [`unsupported platform: ${platform}`],
  });
}

/**
 * Remove a cron entry on the current platform.
 *
 * @param {object} [opts]
 * @param {string} [opts.entryName]  the entry to remove — defaults to CRON_ENTRY_NAME
 * @param {boolean} [opts.dryRun]
 */
export function unregisterCron(opts = {}) {
  const entryName = opts.entryName ?? CRON_ENTRY_NAME;
  if (!entryName || typeof entryName !== 'string' || !ENTRY_NAME_PATTERN.test(entryName)) {
    return errorResult({
      category: ERROR_CATEGORIES.SCHEMA,
      errors: ["entryName: must match /^[a-zA-Z0-9_.-]+$/"],
    });
  }
  const platform = detectPlatform();
  const dryRun = opts.dryRun === true;

  if (platform === 'linux') {
    const shellCmd = `(crontab -l 2>/dev/null | grep -v '${entryName}') | crontab -`;
    if (dryRun) {
      return { action: 'dry-run', platform, executed: false, command: shellCmd, output: '' };
    }
    // timeout: 10s — scheduler operations are fast; a hung crontab
    // command points at a broken host config and should fail loud.
    const r = spawnSync('bash', ['-c', shellCmd], { encoding: 'utf8', timeout: 10_000 });
    return {
      action: r.status === 0 ? 'unregistered' : 'error',
      platform, executed: true, command: shellCmd,
      output: (r.stdout || '') + (r.stderr || ''),
      ...(r.status === 0 ? {} : { error: `crontab exit ${r.status}` }),
    };
  }

  if (platform === 'darwin') {
    const plistPath = macOsPlistPath(entryName);
    if (dryRun) {
      return {
        action: 'dry-run', platform, executed: false,
        command: `launchctl bootout + rm ${plistPath}`, output: '',
      };
    }
    spawnSync('launchctl', ['bootout', `gui/${process.getuid?.() ?? ''}/com.cmk.${entryName}`], { encoding: 'utf8', timeout: 10_000 });
    if (existsSync(plistPath)) {
      try { unlinkSync(plistPath); } catch { /* best-effort */ }
    }
    return {
      action: 'unregistered', platform, executed: true,
      command: `launchctl bootout + rm`, output: '',
    };
  }

  if (platform === 'win32') {
    const cmd = `schtasks /Delete /TN "${entryName}" /F`;
    if (dryRun) {
      return { action: 'dry-run', platform, executed: false, command: cmd, output: '' };
    }
    const r = spawnSync(cmd, { shell: true, encoding: 'utf8', windowsHide: true, timeout: 10_000 });
    return {
      // schtasks /Delete returns non-zero if the task didn't exist;
      // we treat that as "already unregistered" (idempotent) since
      // unregistering a non-existent entry is the intended end-state.
      action: 'unregistered',
      platform, executed: true, command: cmd,
      output: (r.stdout || '') + (r.stderr || ''),
    };
  }

  return errorResult({
    category: ERROR_CATEGORIES.SCHEMA,
    errors: [`unsupported platform: ${platform}`],
  });
}
