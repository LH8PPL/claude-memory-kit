#!/usr/bin/env node
// Stress-runner for the pre-PR gate.
//
// Loops the full test suite N times (default 5) and EXIT-FAILS on the first
// non-green run. The point isn't to chase flakes — it's to lock down the "green
// under realistic load" contract that individual `npm test` invocations
// sometimes hide on Windows (cold-start contention, file-system visibility
// races, live-Haiku rate-limit retry windows).
//
// Default behavior matches production CI: live-Haiku spawn-smokes run (no
// CMK_SKIP_LIVE_HAIKU=1). The agent (Claude running in this repo) invokes
// `npm run stress` before opening any PR whose surface includes spawn
// boundaries, detached children, or hook handlers — i.e. anywhere
// concurrency-class flakes hide.
//
// =========================================================================
// LOGGING IS ALWAYS ON (maintainer directive 2026-06-05, D-68).
//
// Every run writes a per-run JSON result file to `.stress-logs/` via vitest's
// json reporter (`--reporter=default --reporter=json --outputFile.json=…`).
// This is WHY-it-matters: a flake whose run isn't logged is undiagnosable — the
// 2026-06-05 Task 92 gate hit a 4/5 stress whose failing run predated logging,
// so the failing test could never be identified. Always-on JSON closes that.
//
// Crucially this AVOIDS the slowdown that made the old capture mode opt-in: the
// json reporter writes a result file as a SIDE CHANNEL while stdio stays
// 'inherit' (the default reporter still renders to the console at full speed).
// The earlier bash-tee capture forced vitest non-TTY → verbose reporter → ~2x
// slower, which manufactured NEW timing flakes (PR #45 / fix-stress-os-level-tee).
// The json reporter has no such effect: it does not change test execution or
// TTY detection, so it's safe to leave on for every run.
//
// On a failing run the runner PARSES the JSON and prints the failing test
// names, so the gate self-reports what broke instead of scrolling output.
//
// DEEP capture (CMK_STRESS_LOG=1) ADDITIONALLY tees full stdout+stderr to a
// `.log` beside the json, for the rare case the JSON isn't enough (a hard
// crash, or a validator/prerun failure before vitest runs). It's ~2x slower —
// the documented tee/non-TTY cost, which PR #46 measured as a property of
// PIPING (Node-pipe and bash-tee alike), not of the tee program — so it stays
// opt-in.
//
// THE TEE IS NODE'S, NOT A SHELL'S (v0.6.6 sweep). It used to run
// `bash -c '… | tee <log>'`, which is broken on stock Windows: `bash` resolves
// to `C:\Windows\System32\bash.exe`, the WSL launcher, which exits 1 with
// `execvpe /bin/bash failed 2` and NO spawn error — so the deep-log opt-in did
// not degrade, it reported five phantom FAILING RUNS with an empty JSON and a
// hint telling the user to enable the flag they already had on. Node splits the
// child's streams itself now: no shell, no PATH assumption, identical behaviour
// on Windows / macOS / Linux. (This is the cross-platform-command rule applied
// to our own tooling — the previous code was a POSIX command emitted at a
// Windows user.)
// =========================================================================

import { spawn, spawnSync } from 'node:child_process';
import { createWriteStream, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_RUNS = 5;
const runs = Number.parseInt(process.argv[2] ?? '', 10) || DEFAULT_RUNS;

if (process.env.CMK_SKIP_LIVE_HAIKU === '1') {
  console.error(
    'stress-test: refusing to run with CMK_SKIP_LIVE_HAIKU=1. ' +
      'The whole point of stressing is to catch flakes that hide when ' +
      'live spawn-smokes are skipped. Unset the env var and try again.',
  );
  process.exit(2);
}

// DEEP capture = full stdout+stderr tee (slow, opt-in). JSON per-run logging is
// always on regardless.
const DEEP_CAPTURE = process.env.CMK_STRESS_LOG === '1';
const LOG_DIR = '.stress-logs';
mkdirSync(LOG_DIR, { recursive: true });
const sessionStamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '-')
  .replace('T', '_')
  .slice(0, 19);

console.log(
  `stress-test: per-run JSON results → ${LOG_DIR}/${sessionStamp}_run-*.json ` +
    `(always on). ` +
    (DEEP_CAPTURE
      ? `DEEP capture (full stdout tee'd to ${LOG_DIR}/${sessionStamp}_run-*.log) ALSO on — ~2x slower.`
      : `For full stdout capture too (slower): CMK_STRESS_LOG=1 npm run stress.`),
);

// Windows: npm ships as `npm.cmd` and Node's spawn can't resolve .cmd shims
// without shell:true (CVE-2024-27980 hardening). Linux/macOS: shell:true is a
// no-op for argv-style invocation with no shell metacharacters (we pass none).
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const failures = [];
const startedAt = Date.now();

// Args appended to `npm test` so vitest writes a per-run json result file while
// the default reporter keeps rendering to the console (no TTY change, no
// slowdown). Forward slashes so the path survives both the shell:true arg-join
// on Windows and the bash -c string in DEEP mode.
function reporterArgs(jsonPath) {
  return [
    '--',
    '--reporter=default',
    '--reporter=json',
    `--outputFile.json=${jsonPath.replace(/\\/g, '/')}`,
  ];
}

// Parse a vitest json result file → list of "file › test name" for failures.
// Lets the runner name what broke instead of leaving it in scrolled output.
function failedTestNames(jsonPath) {
  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
    const names = [];
    for (const file of data.testResults ?? []) {
      const short = (file.name ?? '').split(/[\\/]/).pop();
      for (const t of file.assertionResults ?? []) {
        if (t.status === 'failed') {
          names.push(`${short} › ${t.fullName ?? t.title ?? '(unnamed)'}`);
        }
      }
    }
    return names;
  } catch {
    return [];
  }
}

/**
 * Run `npm test` with stdout+stderr going to BOTH the console and `logPath`.
 *
 * The shell used to own this (`bash -c '… | tee'`); Node owns it now, so the
 * deep opt-in works wherever Node does. Both streams are merged into the one
 * log in arrival order — the same thing `2>&1 | tee` produced, and the reason
 * it matters here is that a prerun validator's failure lands on stderr while
 * the vitest output around it lands on stdout.
 *
 * Piping (not the tee) is what costs ~2x: it makes vitest non-TTY, so the
 * default reporter goes verbose. That cost is inherent to capturing and is why
 * DEEP stays opt-in — it is not a regression introduced by dropping bash.
 */
async function runTeed(args, logPath) {
  const log = createWriteStream(logPath);
  const child = spawn(npmCmd, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    windowsHide: true,
  });
  child.stdout.on('data', (c) => {
    process.stdout.write(c);
    log.write(c);
  });
  child.stderr.on('data', (c) => {
    process.stderr.write(c);
    log.write(c);
  });

  // Deliberately NOT `events.once(child, 'close')`: that helper rejects when
  // the emitter emits 'error', so a failed spawn would blow up the runner with
  // an unhandled rejection instead of reaching the SPAWN ERROR branch below —
  // which is the exact failure shape this whole fix exists to stop reporting
  // as something else. A failed spawn emits 'error' AND then 'close'; record
  // the error and let 'close' settle, so both paths return the same shape.
  let error = null;
  child.on('error', (e) => {
    error = e;
  });
  // 'close' (not 'exit') — it waits for the piped streams to drain, so the log
  // is complete before the runner reads the run's verdict.
  const [status, signal] = await new Promise((resolve) => {
    child.on('close', (s, sig) => resolve([s, sig]));
  });
  await new Promise((resolve) => log.end(resolve));
  // A signalled child reports status null; surface the signal rather than a
  // silent null that would read as "no exit code" downstream.
  return { status: status ?? (signal ? `signal:${signal}` : null), error };
}

async function runOne(i) {
  const runStart = Date.now();
  const jsonPath = join(LOG_DIR, `${sessionStamp}_run-${i}.json`);
  const fullLogPath = DEEP_CAPTURE
    ? join(LOG_DIR, `${sessionStamp}_run-${i}.log`)
    : null;

  console.log(
    `\n=== stress run ${i}/${runs} ===  (json: ${jsonPath}` +
      (DEEP_CAPTURE ? `, log: ${fullLogPath}` : '') +
      `)`,
  );

  // Same argv either way — the ONLY difference is where the child's stdio
  // goes. The exit code reaches the runner directly in both cases (the old
  // bash path needed `set -o pipefail` to get it back through the pipeline).
  const args = ['test', ...reporterArgs(jsonPath)];
  const r = DEEP_CAPTURE
    ? await runTeed(args, fullLogPath)
    : spawnSync(npmCmd, args, {
        stdio: 'inherit',
        shell: true,
        windowsHide: true,
      });

  const elapsed = ((Date.now() - runStart) / 1000).toFixed(1);
  const code = r.status;
  const spawnErr = r.error;

  if (spawnErr) {
    console.error(`run ${i}: SPAWN ERROR — ${spawnErr.message}`);
    failures.push({ run: i, exit: 'spawn-error', elapsedSec: Number(elapsed), jsonPath, spawnError: spawnErr.message });
    return;
  }

  if (code === 0) {
    console.log(`run ${i}: PASS (${elapsed}s)`);
    return;
  }

  const failed = failedTestNames(jsonPath);
  console.log(`run ${i}: FAIL (${elapsed}s) — exit ${code}`);
  if (failed.length > 0) {
    console.log(`  failing tests (from ${jsonPath}):`);
    for (const n of failed) console.log(`    ✗ ${n}`);
  } else {
    console.log(
      `  (no per-test failures in the JSON — likely a validator/prerun step ` +
        `or a crash before vitest wrote results; ` +
        (DEEP_CAPTURE ? `see ${fullLogPath})` : `re-run with CMK_STRESS_LOG=1 for full stdout)`),
    );
  }
  failures.push({ run: i, exit: code, elapsedSec: Number(elapsed), jsonPath, fullLogPath, failed });
}

for (let i = 1; i <= runs; i++) {
  // Sequential — concurrent runs would invalidate the "green under realistic
  // load" contract since each run becomes its own workload. `await` is what
  // keeps that true now that DEEP capture is async.
  await runOne(i);
}

const totalSec = ((Date.now() - startedAt) / 1000).toFixed(1);
console.log(`\n=== stress summary (${totalSec}s total) ===`);
console.log(`  passed: ${runs - failures.length}/${runs}`);
console.log(`  json logs: ${LOG_DIR}/${sessionStamp}_run-*.json`);
if (failures.length > 0) {
  console.log(`  failed: ${failures.length}/${runs}`);
  for (const f of failures) {
    const errBit = f.spawnError ? ` (spawn-error: ${f.spawnError})` : '';
    console.log(`    run ${f.run}: exit ${f.exit}${errBit} (${f.elapsedSec}s) — json: ${f.jsonPath}`);
    for (const n of f.failed ?? []) console.log(`        ✗ ${n}`);
  }
  console.log(
    `\nInvestigation: each failing run's JSON names the failing tests above. ` +
      `Classify the failure per the kit's stress-gate rule (CLAUDE.md): the ` +
      `narrow live-Haiku jitter exception requires a specific test in the ` +
      `documented jitter set. For full stdout (crashes / prerun failures): ` +
      `CMK_STRESS_LOG=1 npm run stress.`,
  );
  process.exit(1);
}
process.exit(0);
