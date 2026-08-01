#!/usr/bin/env node
// Live-verify: the Task 250 failure-driven health whisper (D-412).
//
// Proves the AUTOMATIC path end-to-end with REAL bins and NO manual command.
// The whisper's whole promise is that a broken kit tells the agent so BY ITSELF
// — so a check that ran `cmk doctor` first, or called the module in-process,
// would structurally mask exactly the property under test (the D-169 lesson:
// every DECISIONS.md test ran `cmk digest` first, so the suite always built the
// thing it was checking, and "nobody runs it automatically" shipped green).
//
// This script therefore:
//   - installs the kit into a THROWAWAY project with an ISOLATED user tier
//     (MEMORY_KIT_USER_DIR), so it can never touch real state;
//   - seeds a failure streak into `context/.locks/health.log` — the same file
//     the instrumented ops write, i.e. it fakes the FAILURE, never the report;
//   - fires ONLY the real `cmk-capture-prompt` bin as a subprocess with a
//     realistic UserPromptSubmit payload on stdin;
//   - asserts the whisper appears in the bin's real stdout, that the
//     memory-off case also emits the user-visible `systemMessage`, and that a
//     recovered kit goes quiet with no reset command.
//
// Zero LLM calls, zero network: the whisper path is deterministic, so unlike
// the sibling live-verify scripts this one is cheap and safe to run any time.
//
// Run: npm run live-verify:health-whisper   [--keep] [--verbose]

import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, appendFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir, platform } from 'node:os';
import { join, dirname, delimiter } from 'node:path';
import { fileURLToPath } from 'node:url';

const IS_WIN = platform() === 'win32';
const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const DEV_BIN_DIR = join(REPO_ROOT, 'packages', 'cli', 'bin');
const KEEP = process.argv.includes('--keep');
const VERBOSE = process.argv.includes('--verbose');

const BIN_NAMES = [
  'cmk', 'cmk-daily-distill', 'cmk-weekly-curate', 'cmk-compress-lazy',
  'cmk-inject-context', 'cmk-capture-prompt', 'cmk-observe-edit',
  'cmk-capture-turn', 'cmk-compress-session',
];

function log(...a) {
  console.log('[live-verify:health-whisper]', ...a);
}
function vlog(...a) {
  if (VERBOSE) console.log('[live-verify:health-whisper]', ...a);
}

/** Point the bare bin names at the DEV tree, so we test THIS checkout. */
function writeShims(binDir) {
  mkdirSync(binDir, { recursive: true });
  for (const name of BIN_NAMES) {
    const target = join(DEV_BIN_DIR, `${name}.mjs`);
    if (IS_WIN) {
      writeFileSync(join(binDir, `${name}.cmd`), `@echo off\r\nnode "${target}" %*\r\n`, 'utf8');
    } else {
      const p = join(binDir, name);
      writeFileSync(p, `#!/bin/sh\nexec node "${target}" "$@"\n`, 'utf8');
      chmodSync(p, 0o755);
    }
  }
}

const results = [];
function check(label, ok, detail = '') {
  results.push({ label, ok, detail });
  log(`  ${ok ? 'PASS' : 'FAIL'} — ${label}${ok || !detail ? '' : ` (${detail})`}`);
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), 'cmk-whisper-live-'));
  const binDir = join(root, 'shimbin');
  const userDir = join(root, 'userdir');
  const proj = join(root, 'project');
  mkdirSync(userDir, { recursive: true });
  mkdirSync(proj, { recursive: true });
  writeShims(binDir);
  log(`sandbox: ${root}`);

  const env = {
    ...process.env,
    PATH: binDir + delimiter + process.env.PATH,
    Path: binDir + delimiter + (process.env.Path ?? process.env.PATH),
    MEMORY_KIT_USER_DIR: userDir,
    CMK_PROJECT_DIR: proj,
  };

  /** Fire the REAL UserPromptSubmit hook bin. Nothing else runs. */
  function firePromptHook(prompt) {
    const r = spawnSync(process.execPath, [join(DEV_BIN_DIR, 'cmk-capture-prompt.mjs')], {
      cwd: proj,
      env,
      encoding: 'utf8',
      timeout: 30_000,
      input: JSON.stringify({
        session_id: 'live-verify-whisper',
        hook_event_name: 'UserPromptSubmit',
        cwd: proj,
        prompt,
      }),
    });
    vlog(`hook exit=${r.status} stdout=${r.stdout}`);
    let parsed = null;
    try {
      parsed = JSON.parse(r.stdout ?? '');
    } catch {
      /* leave null — asserted below */
    }
    return { raw: r, parsed };
  }

  const healthLog = join(proj, 'context', '.locks', 'health.log');
  function seedFailures(cls, n) {
    mkdirSync(dirname(healthLog), { recursive: true });
    const lines = [];
    for (let i = n; i >= 1; i--) {
      lines.push(
        JSON.stringify({
          ts: new Date(Date.now() - i * 60_000).toISOString(),
          schema: 1,
          class: cls,
          outcome: 'fail',
        }),
      );
    }
    writeFileSync(healthLog, lines.join('\n') + '\n', 'utf8');
  }
  function seedSuccess(cls) {
    appendFileSync(
      healthLog,
      JSON.stringify({ ts: new Date().toISOString(), schema: 1, class: cls, outcome: 'ok' }) + '\n',
      'utf8',
    );
  }

  try {
    // ---- install the kit for real -------------------------------------------
    const cmkBin = join(binDir, IS_WIN ? 'cmk.cmd' : 'cmk');
    const inst = spawnSync(cmkBin, ['install'], {
      cwd: proj,
      env,
      encoding: 'utf8',
      timeout: 120_000,
      shell: IS_WIN,
    });
    if (inst.status !== 0) throw new Error(`cmk install failed: ${inst.stderr}`);
    log('kit installed into the throwaway project');

    // ---- 1. a HEALTHY kit says nothing about health -------------------------
    const healthy = firePromptHook('what did we decide about the deploy target?');
    check(
      'healthy kit: the real bin emits NO whisper and NO systemMessage',
      healthy.raw.status === 0 &&
        !(healthy.parsed?.hookSpecificOutput?.additionalContext ?? '').includes('troubleshooting') &&
        healthy.parsed?.systemMessage === undefined,
      `stdout=${healthy.raw.stdout?.slice(0, 200)}`,
    );

    // ---- 2. THE AUTOMATIC PATH: a seeded streak whispers, no command run ----
    seedFailures('extract-failing', 2);
    const broken = firePromptHook('go'); // 2 chars: the recall hint is null here
    const ctx = broken.parsed?.hookSpecificOutput?.additionalContext ?? '';
    check(
      'broken kit: the whisper appears in the REAL bin stdout with NO manual command',
      ctx.includes('core-memory-kit') && ctx.includes('troubleshooting'),
      `additionalContext=${ctx.slice(0, 200)}`,
    );
    check(
      'the whisper names the exact fix command',
      ctx.includes('cmk doctor'),
      `additionalContext=${ctx.slice(0, 200)}`,
    );
    check(
      'the whisper carries the STABLE CODE the repair book is sectioned by',
      ctx.includes('extract-failing'),
      `additionalContext=${ctx.slice(0, 200)}`,
    );
    check(
      'it fires on a 2-char prompt — it does NOT inherit the recall hint gates',
      ctx.includes('troubleshooting') && !ctx.includes('memory-search'),
      `additionalContext=${ctx.slice(0, 200)}`,
    );
    check(
      'memory-off ALSO emits the user-visible systemMessage, as a sibling field',
      typeof broken.parsed?.systemMessage === 'string' &&
        broken.parsed.systemMessage.includes('core-memory-kit'),
      `systemMessage=${broken.parsed?.systemMessage}`,
    );
    check(
      'the hook still exits 0 and returns continue:true (it never blocks a prompt)',
      broken.raw.status === 0 && broken.parsed?.continue === true,
      `exit=${broken.raw.status}`,
    );

    // ---- 3. a single blip must NOT whisper (the noise threshold, live) ------
    seedFailures('extract-failing', 1);
    const blip = firePromptHook('go');
    check(
      'a single stochastic failure does NOT whisper (the noise gate holds on the real bin)',
      !(blip.parsed?.hookSpecificOutput?.additionalContext ?? '').includes('troubleshooting'),
      `additionalContext=${blip.parsed?.hookSpecificOutput?.additionalContext}`,
    );

    // ---- 4. SELF-CLEAN: one success and it goes quiet, with no reset --------
    seedFailures('extract-failing', 3);
    const stillBroken = firePromptHook('go');
    seedSuccess('extract-failing');
    const recovered = firePromptHook('go');
    check(
      'self-clean: after ONE success the whisper is gone — no command, no state file',
      (stillBroken.parsed?.hookSpecificOutput?.additionalContext ?? '').includes('troubleshooting') &&
        !(recovered.parsed?.hookSpecificOutput?.additionalContext ?? '').includes('troubleshooting') &&
        recovered.parsed?.systemMessage === undefined,
      `after=${recovered.parsed?.hookSpecificOutput?.additionalContext}`,
    );

    // ---- 5. doctor agrees with the whisper (the shared-threshold contract) --
    seedFailures('agent-cli-missing', 1); // deterministic → fires on one strike
    const whispered = firePromptHook('go');
    const doc = spawnSync(cmkBin, ['doctor'], {
      cwd: proj,
      env,
      encoding: 'utf8',
      timeout: 120_000,
      shell: IS_WIN,
    });
    const docOut = `${doc.stdout ?? ''}${doc.stderr ?? ''}`;
    check(
      'HC-14 and the whisper agree: both report the same active code on the same evidence',
      (whispered.parsed?.hookSpecificOutput?.additionalContext ?? '').includes('troubleshooting') &&
        docOut.includes('HC-14') &&
        docOut.includes('agent-cli-missing'),
      `doctor HC-14 line: ${docOut.split(/\r?\n/).filter((l) => l.includes('HC-14')).join(' | ')}`,
    );
  } finally {
    if (KEEP) {
      log(`--keep set; sandbox preserved at ${root}`);
    } else {
      try {
        rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      } catch (e) {
        log(`cleanup: could not remove ${root} (${e?.code ?? e?.message}); OS will reclaim tmpdir`);
      }
    }
  }

  console.log('');
  log('============ HEALTH WHISPER LIVE VERIFY ============');
  for (const r of results) log(`  ${r.ok ? 'PASS' : 'FAIL'} — ${r.label}`);
  log('===================================================');
  const failed = results.filter((r) => !r.ok);
  if (failed.length === 0) {
    log('The whisper fires automatically on the REAL hook bin. No manual command anywhere.');
    process.exit(0);
  }
  log(`${failed.length} check(s) FAILED.`);
  process.exit(1);
}

main().catch((err) => {
  console.error('[live-verify:health-whisper] ERROR:', err?.stack ?? err);
  process.exit(2);
});
