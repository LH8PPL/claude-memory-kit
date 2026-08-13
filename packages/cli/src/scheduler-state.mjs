// scheduler-state.mjs — read back what the HOST scheduler actually has
// registered for a kit job (Task 47, D-354 + D-452).
//
// WHY THIS EXISTS. HC-5 used to answer "did we ever register a cron?" by
// checking a sentinel file the kit itself wrote. That is not the question a
// user is asking, and D-354 is the proof: the v0.5.4 package rename left a
// Windows scheduled task pointing at an absolute path under the DEAD package
// name, the nightly distill failed silently four nights running, and HC-5
// reported PASS the entire time — because the sentinel it reads has nothing to
// do with the task. A registration is HOST state; the only honest way to check
// it is to ask the host.
//
// Public boundary:
//   readRegisteredJob({entryName, platform?, spawn?, readFile?, exists?, homeDir?})
//     → {verdict, targetPath?, problems, detail}
//
//   verdict:
//     'ok'             — the entry is registered, its target exists, and (win32)
//                        its settings match WINDOWS_TASK_SETTINGS.
//     'target-missing'  — registered, but the command it runs is not on disk.
//     'not-registered'  — the scheduler has no such entry.
//     'settings-stale'  — registered and present, but carrying the pre-v0.6.6
//                        battery/idle posture (§8.6.5). win32 only.
//     'settings-unknown'— the command exists, but the task carried no readable
//                        <Settings> block, so the posture was NOT verified.
//                        Separate from both neighbours on purpose: calling it
//                        `settings-stale` would assert flags we never saw, and
//                        calling the whole read `unreadable` would discard a
//                        target check that succeeded. win32 only.
//     'unreadable'      — WE COULD NOT TELL. Never a guess; the caller SKIPs.
//
// THE VERDICTS ARE RANKED, and the ranking is a decision, not an accident:
// `target-missing` outranks `settings-stale` because a job whose command does
// not exist cannot run at all, while a job with the wrong flags merely runs
// badly. `problems` is still populated on a target-missing result — the same
// re-registration fixes both, and reporting half the truth is how the original
// bug survived four nights.
//
// EVERYTHING IS INJECTED (`spawn` / `readFile` / `exists` / `platform` /
// `homeDir`) because none of the three platform legs can be exercised on any
// single CI host, and because the alternative — testing this against a real
// scheduler — means a test suite that registers scheduled tasks on whoever runs
// it. Production passes nothing and gets the real implementations.
//
// IT IS READ-ONLY BY CONSTRUCTION. No writer is injected and none is imported.
// A probe that writes is a probe that changes what it measures, and the durable
// record of a bad posture belongs to `register-crons` (Task 47.0), which knows
// the outcome first-hand rather than inferring it.

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { inspectWindowsTaskSettings } from './register-crons.mjs';

/** Scheduler queries are fast; a hang means a broken host, and doctor must not wedge on it. */
const QUERY_TIMEOUT_MS = 10_000;

/**
 * Decode a scheduler's stdout.
 *
 * `schtasks /query /XML` emits UTF-16 with a BOM and CRLF (the D-306 class).
 * Asking Node for `encoding: 'utf8'` would hand us mojibake padded with NUL bytes in
 * which every regex below silently fails to match — presenting as a permanent,
 * innocent-looking `unreadable`, i.e. a check that never checks anything. So we
 * always read BYTES and sniff the BOM here.
 */
function decodeSchedulerOutput(buf) {
  if (buf === null || buf === undefined) return '';
  if (typeof buf === 'string') return buf;
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return buf.toString('utf16le', 2);
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    // UTF-16 BE — swap to LE rather than fail. Not observed from schtasks, but
    // a two-line defence beats an unexplained SKIP on some future locale.
    const swapped = Buffer.from(buf.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  return buf.toString('utf8').replace(/^\uFEFF/, '');
}

/**
 * Pull the file paths out of a command line.
 *
 * Deliberately conservative: only tokens that END in an extension the kit
 * actually registers are returned. The alternative — treating every
 * space-separated token as a possible path — turns `//B` and `//Nologo` into
 * phantom "missing targets" and makes the check fail on a healthy machine.
 */
function extractPaths(commandLine) {
  const out = [];
  const text = String(commandLine ?? '');
  // Quoted first (paths with spaces are the norm on Windows), then bare.
  for (const m of text.matchAll(/"([^"]+)"/g)) out.push(m[1]);
  for (const m of text.matchAll(/(?:^|\s)([^\s"]+)/g)) out.push(m[1]);
  return out.filter((p) => /\.(mjs|cjs|js|vbs)$/i.test(p));
}

/**
 * The kit's real work is always a `.mjs` bin; a `.vbs` is the Task-215
 * windowless shim standing in front of it. Prefer the script, and report the
 * shim only when there is nothing behind it to prefer.
 */
function pickScript(paths) {
  return paths.find((p) => /\.(mjs|cjs|js)$/i.test(p)) ?? paths.find((p) => /\.vbs$/i.test(p)) ?? null;
}

function result(verdict, { targetPath, problems = [], detail = '' } = {}) {
  return { verdict, ...(targetPath ? { targetPath } : {}), problems, detail };
}

/**
 * Read back one registered job.
 *
 * @param {object} opts
 * @param {string} opts.entryName   e.g. CRON_ENTRY_NAME
 * @param {string} [opts.platform]  test seam; defaults to process.platform
 * @param {Function} [opts.spawn]   test seam; defaults to spawnSync
 * @param {Function} [opts.readFile] test seam; defaults to readFileSync(utf8)
 * @param {Function} [opts.exists]  test seam; defaults to existsSync
 * @param {string} [opts.homeDir]   test seam; defaults to os.homedir()
 */
export function readRegisteredJob({
  entryName,
  platform = process.platform,
  spawn = spawnSync,
  readFile = (p) => readFileSync(p, 'utf8'),
  exists = existsSync,
  homeDir = homedir(),
} = {}) {
  if (!entryName || typeof entryName !== 'string') {
    return result('unreadable', { detail: 'entryName is required' });
  }
  try {
    if (platform === 'win32') return readWindows({ entryName, spawn, readFile, exists });
    if (platform === 'linux') return readLinux({ entryName, spawn, exists });
    if (platform === 'darwin') return readDarwin({ entryName, readFile, exists, homeDir });
    return result('unreadable', { detail: `unsupported platform: ${platform}` });
  } catch (err) {
    // A probe must never take doctor down. Anything unanticipated reads as
    // "could not tell", which the caller renders as a SKIP.
    return result('unreadable', { detail: `${err?.code ?? ''} ${err?.message ?? err}`.trim() });
  }
}

function readWindows({ entryName, spawn, readFile, exists }) {
  // Absolute System32 path, never PATH-resolved: schtasks reads and writes
  // scheduled tasks, so a hijacked `schtasks.exe` in a writable directory is a
  // privilege-escalation vector (Sonar S4036) — the same guard register-crons
  // applies on the write side.
  const schtasksExe = join(
    process.env.SystemRoot || process.env.windir || 'C:\\Windows',
    'System32',
    'schtasks.exe',
  );
  let r;
  try {
    r = spawn(schtasksExe, ['/query', '/TN', entryName, '/XML', 'ONE'], {
      encoding: 'buffer',
      windowsHide: true,
      timeout: QUERY_TIMEOUT_MS,
    });
  } catch (err) {
    // Defence in depth only — see the check below for the shape that actually
    // occurs in production.
    return result('unreadable', { detail: `${err?.code ?? ''} ${err?.message ?? err}`.trim() });
  }
  // THE LAUNCH FAILED, which is not the same fact as "the scheduler said no".
  //
  // `spawnSync` does NOT throw on ENOENT or ETIMEDOUT — it RETURNS
  // `{error: <Error>, status: null}`. So the catch above never fires for the
  // cases that matter, and without this check an unlaunchable or timed-out
  // schtasks fell through to the non-zero-status branch below and reported
  // `not-registered` — making HC-5 FAIL with "the host scheduler has no such
  // entry", a claim about the user's scheduler drawn from a command that never
  // ran. `status === null` is also checked directly: a kill-by-signal can leave
  // a null status with no `error` object, and reading that as "no such task"
  // would be the same wrong claim by another route.
  // (House pattern: mcp-procs.mjs's `r.error || r.status !== 0` — split here,
  // because these two need DIFFERENT verdicts.)
  if (!r || r.error || r.status === null || r.status === undefined) {
    const why = r?.error ? `${r.error.code ?? ''} ${r.error.message ?? r.error}`.trim() : 'the query did not complete';
    return result('unreadable', { detail: why });
  }
  if (r.status !== 0) {
    // The scheduler DENIES a task the sentinel claims the kit registered.
    // Reported as a failure rather than as "unreadable" on purpose: whether the
    // task was deleted or the query is broken, the answer is the same
    // idempotent, non-destructive `cmk register-crons`. This repo's history is
    // unambiguous that a false green costs more than a false alarm naming a
    // harmless command (D-354 itself is four nights of exactly that trade).
    const why = decodeSchedulerOutput(r?.stderr).trim() || `schtasks exit ${r?.status}`;
    return result('not-registered', { detail: why });
  }
  const xml = decodeSchedulerOutput(r.stdout);
  const settings = inspectWindowsTaskSettings(xml);
  const cmd = /<Command>([^<]*)<\/Command>/.exec(xml)?.[1] ?? '';
  const args = /<Arguments>([^<]*)<\/Arguments>/.exec(xml)?.[1] ?? '';
  if (settings.verdict === 'unreadable' && !cmd) {
    return result('unreadable', { detail: 'schtasks returned something that is not a task definition' });
  }
  const problems = settings.verdict === 'needs-repair' ? settings.problems : [];
  // M8 — a readable Command with an UNREADABLE Settings block used to fall
  // through to `ok`, i.e. "posture verified" on a posture nobody could read.
  // That is the false-green shape this whole check exists to remove, so it gets
  // its own verdict rather than being folded into either neighbour: calling it
  // `settings-stale` would assert flags we never saw, and calling the whole
  // read `unreadable` would throw away the target check, which DID succeed.
  const settingsUnknown = settings.verdict === 'unreadable' && Boolean(cmd);

  let target = pickScript(extractPaths(`${cmd} ${args}`));
  if (!target) {
    return result('unreadable', { problems, detail: 'no runnable target found in the task definition' });
  }
  // The Task-215 indirection. Post-215 the task runs `wscript.exe //B //Nologo
  // "<shim>.vbs"`, so the path D-354 stranded — the kit's own .mjs under a
  // package name that no longer exists — is not in the task XML at all; it is
  // inside the VBS. A check that stopped at the task's own Arguments would
  // declare D-354's exact bug healthy.
  if (/\.vbs$/i.test(target)) {
    if (!exists(target)) {
      return result('target-missing', { targetPath: target, problems, detail: `the registered launcher is gone: ${target}` });
    }
    let shimText;
    try {
      shimText = readFile(target);
    } catch (err) {
      return result('unreadable', { targetPath: target, problems, detail: `launcher unreadable: ${err?.message ?? err}` });
    }
    const inner = pickScript(extractPaths(shimText));
    if (!inner) {
      return result('unreadable', { targetPath: target, problems, detail: 'the launcher names no script' });
    }
    target = inner;
  }
  if (!exists(target)) {
    return result('target-missing', { targetPath: target, problems, detail: `the registered command no longer exists: ${target}` });
  }
  if (problems.length > 0) return result('settings-stale', { targetPath: target, problems });
  if (settingsUnknown) {
    return result('settings-unknown', {
      targetPath: target,
      problems,
      detail: 'the task definition carried no readable <Settings> block, so its scheduler posture was not verified',
    });
  }
  return result('ok', { targetPath: target, problems });
}

function readLinux({ entryName, spawn, exists }) {
  let r;
  try {
    r = spawn('crontab', ['-l'], { encoding: 'buffer', timeout: QUERY_TIMEOUT_MS });
  } catch (err) {
    return result('unreadable', { detail: `${err?.code ?? ''} ${err?.message ?? err}`.trim() });
  }
  // Same split as the Windows leg (I2): a crontab binary that could not be
  // LAUNCHED means we could not tell, and must not be reported as "no crontab
  // line tagged '# cmk-daily-distill'" — that would be a claim about the user's
  // crontab drawn from a command that never ran.
  if (!r || r.error || r.status === null || r.status === undefined) {
    const why = r?.error ? `${r.error.code ?? ''} ${r.error.message ?? r.error}`.trim() : 'the query did not complete';
    return result('unreadable', { detail: why });
  }
  // A CLEAN non-zero exit is different, and stays `not-registered`: that is what
  // `crontab -l` does when the user simply has no crontab, which is an answer.
  const text = decodeSchedulerOutput(r?.stdout);
  // The trailing `# <entryName>` comment is what registerCron writes to make the
  // entry findable; matching on it is matching the kit's own contract rather
  // than guessing at cron syntax.
  const line = text.split('\n').find((l) => l.includes(`# ${entryName}`));
  if (!line) return result('not-registered', { detail: `no crontab line tagged '# ${entryName}'` });
  const target = pickScript(extractPaths(line));
  if (!target) return result('unreadable', { detail: 'no runnable target found in the crontab line' });
  if (!exists(target)) {
    return result('target-missing', { targetPath: target, detail: `the registered command no longer exists: ${target}` });
  }
  return result('ok', { targetPath: target });
}

function readDarwin({ entryName, readFile, exists, homeDir }) {
  const plistPath = join(homeDir, 'Library', 'LaunchAgents', `com.cmk.${entryName}.plist`);
  if (!exists(plistPath)) return result('not-registered', { detail: `no LaunchAgent at ${plistPath}` });
  let text;
  try {
    text = readFile(plistPath);
  } catch (err) {
    return result('unreadable', { detail: `LaunchAgent unreadable: ${err?.message ?? err}` });
  }
  // ProgramArguments is an <array> of <string>; the script is one of them.
  const strings = [...text.matchAll(/<string>([^<]*)<\/string>/g)].map((m) => m[1]);
  const target = pickScript(strings.filter((s) => /\.(mjs|cjs|js|vbs)$/i.test(s)));
  if (!target) return result('unreadable', { detail: 'no runnable target found in the LaunchAgent plist' });
  if (!exists(target)) {
    return result('target-missing', { targetPath: target, detail: `the registered command no longer exists: ${target}` });
  }
  return result('ok', { targetPath: target });
}
