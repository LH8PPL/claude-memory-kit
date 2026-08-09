// @doors: 1, 3
// Door 1 (response): the verdict + targetPath + problems + detail this module
//   returns ARE its contract — HC-5 renders them and decides pass/warn/fail
//   from nothing else, so every branch is asserted on the returned object.
// Door 3 (external calls): the whole point of the module is that it shells out
//   to a host scheduler. WHAT it spawns is pinned — the absolute System32
//   schtasks path (never PATH-resolvable, Sonar S4036 / the register-crons
//   precedent) and the verbatim argv — not merely that a spawn happened.
// Door 2 N/A: this module is READ-ONLY. It stats and parses; it writes nothing,
//   which is itself asserted (the injected writers are absent by construction —
//   only `spawn`, `readFile` and `exists` are injected).
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: it emits no log of its own. The health-log entry for a bad
//   posture is written by `register-crons` (Task 47.0), not here — this module
//   is a probe, and a probe that logs is a probe that changes what it measures.

// Tests for Task 47 (D-354) — reading back what the host scheduler ACTUALLY has.
//
// WHY THIS EXISTS. HC-5 used to answer "did we ever register a cron?" by
// looking at a sentinel file the kit itself wrote. That question is not the one
// a user cares about, and D-354 is the proof: the v0.5.4 package rename left a
// scheduled task pointing at an absolute path under the DEAD package name, the
// nightly distill failed silently for four nights, and HC-5 stayed green the
// whole time because the sentinel it checks had nothing to do with the task.
// The registration is host state; the only honest way to check it is to ask the
// host.
//
// THE TWO QUESTIONS ARE ASKED FROM ONE READ. `schtasks /query /XML` returns the
// whole task definition, which answers both "does the registered target still
// exist" (D-354) and "did the settings actually apply" (Task 47.0 / D-439) —
// the second via `inspectWindowsTaskSettings`, which Task 265 shipped pure and
// unwired for exactly this caller.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRegisteredJob } from '../packages/cli/src/scheduler-state.mjs';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const preXml = readFileSync(join(repoRoot, 'fixtures/schtasks/cmk-daily-distill-pre-265.xml'), 'utf8');
const postXml = readFileSync(join(repoRoot, 'fixtures/schtasks/cmk-daily-distill-post-265.xml'), 'utf8');

const SHIM = 'C:\\proj\\context\\.locks\\cmk-daily-distill-run.vbs';
const SCRIPT = 'C:\\proj\\node_modules\\@lh8ppl\\core-memory-kit\\bin\\cmk-daily-distill.mjs';

/** The VBS the Task-215 shim really writes, CRLF and all. */
function shimText(script = SCRIPT) {
  return [
    "' core-memory-kit — windowless launcher",
    'Set sh = CreateObject("WScript.Shell")',
    `sh.Run "\"\"C:\\Program Files\\nodejs\\node.exe\"\" \"\"${script}\"\" \"\"C:\\proj\"\"", 0, True`,
    '',
  ].join('\r\n');
}

/**
 * schtasks emits UTF-16 with a BOM and CRLF (the D-306 class). Encoding the
 * fixture that way is the point of the test, not incidental setup: a naive
 * utf8 read of this buffer produces NUL-interleaved mojibake in which every
 * regex in the module silently fails to match — which would present as
 * `unreadable`, i.e. a permanent honest-looking SKIP that never checks anything.
 */
function asSchtasksOutput(xml) {
  return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(xml.replace(/\n/g, '\r\n'), 'utf16le')]);
}

function winDeps({ xml = postXml, status = 0, stderr = '', shim = shimText(), present = new Set([SHIM, SCRIPT]), spawnThrows = false, spawnCalls = [] } = {}) {
  return {
    platform: 'win32',
    spawn: (cmd, args, opts) => {
      spawnCalls.push({ cmd, args, opts });
      if (spawnThrows) {
        const err = new Error('spawnSync schtasks.exe ENOENT');
        err.code = 'ENOENT';
        throw err;
      }
      return { status, stdout: xml === null ? Buffer.alloc(0) : asSchtasksOutput(xml), stderr: Buffer.from(stderr, 'utf8') };
    },
    readFile: (p) => {
      if (String(p).toLowerCase().endsWith('.vbs')) {
        if (shim === null) throw new Error('EACCES');
        return shim;
      }
      throw new Error(`unexpected read: ${p}`);
    },
    exists: (p) => present.has(String(p)),
    spawnCalls,
  };
}

describe('readRegisteredJob — win32', () => {
  it('resolves the real script THROUGH the windowless shim and reports ok', () => {
    // The load-bearing indirection: post-Task-215 the task runs `wscript.exe
    // //B //Nologo "<shim>.vbs"`, so the path D-354 stranded — the kit's own
    // .mjs under a package name that no longer exists — is not in the task XML
    // at all. It is inside the VBS. A check that stopped at the task's own
    // Arguments would have declared D-354's exact bug healthy.
    const d = winDeps();
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...d });
    expect(r.verdict).toBe('ok');
    expect(r.targetPath).toBe(SCRIPT);
  });

  it('FAILS as target-missing when the resolved script is gone (the D-354 bug itself)', () => {
    const d = winDeps({ present: new Set([SHIM]) }); // shim survives, script renamed away
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...d });
    expect(r.verdict).toBe('target-missing');
    expect(r.targetPath).toBe(SCRIPT);
    expect(r.detail).toContain('cmk-daily-distill.mjs');
  });

  it('reports target-missing when the SHIM itself is gone', () => {
    const d = winDeps({ present: new Set() });
    expect(readRegisteredJob({ entryName: 'cmk-daily-distill', ...d }).verdict).toBe('target-missing');
  });

  it('still checks the target when there is no shim — a pre-215 direct registration', () => {
    const xml = postXml.replace(
      /<Command>[^<]*<\/Command>\s*<Arguments>[^<]*<\/Arguments>/,
      `<Command>C:\\Program Files\\nodejs\\node.exe</Command><Arguments>"${SCRIPT}" "C:\\proj"</Arguments>`,
    );
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ xml, present: new Set([SCRIPT]) }) });
    expect(r.verdict).toBe('ok');
    expect(r.targetPath).toBe(SCRIPT);
  });

  it('reports settings-stale on a pre-v0.6.6 task, naming the hostile flags (Task 47.0)', () => {
    // The committed pre-265 capture: real flags, read off a real machine.
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ xml: preXml }) });
    expect(r.verdict).toBe('settings-stale');
    const named = r.problems.map((p) => p.setting).sort();
    expect(named).toEqual(['DisallowStartIfOnBatteries', 'StopIfGoingOnBatteries', 'StopOnIdleEnd']);
  });

  it('a MISSING TARGET outranks stale settings — a job that cannot run at all is the bigger fact', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ xml: preXml, present: new Set([SHIM]) }) });
    expect(r.verdict).toBe('target-missing');
    // The settings finding is not DISCARDED, just outranked — re-registering
    // fixes both, and the report should not hide half the problem.
    expect(r.problems.length).toBeGreaterThan(0);
  });

  it('decodes the UTF-16 + BOM + CRLF payload schtasks really emits (the D-306 class)', () => {
    // Guard against the regression where a utf8 read turns every match into a
    // miss and the check degrades to a permanent, innocent-looking SKIP.
    expect(readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps() }).verdict).toBe('ok');
  });

  it('spawns the ABSOLUTE System32 schtasks with a verbatim argv (Door 3)', () => {
    const spawnCalls = [];
    readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ spawnCalls }) });
    expect(spawnCalls).toHaveLength(1);
    const { cmd, args, opts } = spawnCalls[0];
    // Never PATH-resolvable: a hijacked schtasks.exe in a writable dir is the
    // same escalation vector register-crons guards against on the write side.
    expect(cmd.toLowerCase()).toMatch(/system32[\\/]schtasks\.exe$/);
    expect(args).toEqual(['/query', '/TN', 'cmk-daily-distill', '/XML', 'ONE']);
    expect(opts.windowsHide).toBe(true);
    expect(typeof opts.timeout).toBe('number');
    // Buffer, not 'utf8' — decoding is this module's job, and asking Node for
    // utf8 is exactly how the UTF-16 payload gets destroyed before we see it.
    expect(opts.encoding).toBe('buffer');
  });

  it('a non-zero schtasks exit is NOT-REGISTERED — the scheduler denies a task the sentinel claims', () => {
    // Deliberately a FAIL-shaped verdict rather than "unreadable". The sentinel
    // asserts the kit registered this; the scheduler says it cannot produce it.
    // Whether it was deleted or the query is broken, the answer is the same
    // idempotent, non-destructive `cmk register-crons` -- and this repo's whole
    // history says a false green costs more than a false alarm that names a
    // harmless command.
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ status: 1, stderr: 'ERROR: The system cannot find the file specified.' }) });
    expect(r.verdict).toBe('not-registered');
  });

  it('a MISSING schtasks binary is UNREADABLE, not a failure — we could not tell', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ spawnThrows: true }) });
    expect(r.verdict).toBe('unreadable');
    expect(r.detail).toMatch(/ENOENT/i);
  });

  it('output that is not a task definition is UNREADABLE, never a false needs-repair', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ xml: 'not xml at all' }) });
    expect(r.verdict).toBe('unreadable');
  });

  it('an unreadable shim is UNREADABLE — we know the shim exists but not what it runs', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...winDeps({ shim: null }) });
    expect(r.verdict).toBe('unreadable');
  });
});

describe('readRegisteredJob — linux (crontab)', () => {
  const LINE = `0 23 * * * "/usr/bin/node" "/home/u/.npm/lib/node_modules/@lh8ppl/core-memory-kit/bin/cmk-daily-distill.mjs" "/home/u/proj" # cmk-daily-distill`;
  const SCRIPT_POSIX = '/home/u/.npm/lib/node_modules/@lh8ppl/core-memory-kit/bin/cmk-daily-distill.mjs';

  function linuxDeps({ out = `${LINE}\n0 9 * * 0 x # cmk-weekly-curate\n`, status = 0, present = new Set([SCRIPT_POSIX]), spawnCalls = [] } = {}) {
    return {
      platform: 'linux',
      spawn: (cmd, args, opts) => {
        spawnCalls.push({ cmd, args, opts });
        return { status, stdout: Buffer.from(out, 'utf8'), stderr: Buffer.alloc(0) };
      },
      exists: (p) => present.has(String(p)),
      readFile: () => { throw new Error('no shim on POSIX'); },
      spawnCalls,
    };
  }

  it('finds the entry by its trailing name comment and verifies the script exists', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...linuxDeps() });
    expect(r.verdict).toBe('ok');
    expect(r.targetPath).toBe(SCRIPT_POSIX);
  });

  it('FAILS as target-missing when the registered script is gone', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...linuxDeps({ present: new Set() }) });
    expect(r.verdict).toBe('target-missing');
  });

  it('reports not-registered when no line carries the entry name', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...linuxDeps({ out: '0 9 * * 0 x # something-else\n' }) });
    expect(r.verdict).toBe('not-registered');
  });

  it('never reports settings-stale — the Windows posture has no POSIX equivalent (§8.6.5)', () => {
    // Non-regression guard: the Task-265 flag machinery must not leak into the
    // POSIX legs, on the read side as well as the write side.
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...linuxDeps() });
    expect(r.problems).toEqual([]);
  });

  it('spawns `crontab -l`, not a shell (Door 3)', () => {
    const spawnCalls = [];
    readRegisteredJob({ entryName: 'cmk-daily-distill', ...linuxDeps({ spawnCalls }) });
    expect(spawnCalls[0].cmd).toBe('crontab');
    expect(spawnCalls[0].args).toEqual(['-l']);
    expect(spawnCalls[0].opts.shell).toBeFalsy();
  });
});

describe('readRegisteredJob — darwin (launchd)', () => {
  const SCRIPT_MAC = '/Users/u/.npm/lib/node_modules/@lh8ppl/core-memory-kit/bin/cmk-daily-distill.mjs';
  const PLIST = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<plist version="1.0"><dict>',
    '  <key>Label</key><string>com.cmk.cmk-daily-distill</string>',
    '  <key>ProgramArguments</key>',
    '  <array>',
    '    <string>/usr/local/bin/node</string>',
    `    <string>${SCRIPT_MAC}</string>`,
    '    <string>/Users/u/proj</string>',
    '  </array>',
    '</dict></plist>',
  ].join('\n');

  function macDeps({ plist = PLIST, plistExists = true, present = new Set([SCRIPT_MAC]) } = {}) {
    // Built with `join`, exactly as the module builds it. A hardcoded
    // forward-slash literal here passes on POSIX and fails on the Windows host
    // this suite also runs on — the test would then be asserting the separator
    // convention of whoever ran it rather than the module's behaviour.
    const plistPath = join('/Users/u', 'Library', 'LaunchAgents', 'com.cmk.cmk-daily-distill.plist');
    return {
      platform: 'darwin',
      homeDir: '/Users/u',
      spawn: () => { throw new Error('darwin must not spawn — the plist is a file'); },
      readFile: (p) => {
        if (String(p) === plistPath) {
          if (plist === null) throw new Error('EACCES');
          return plist;
        }
        throw new Error(`unexpected read: ${p}`);
      },
      exists: (p) => (String(p) === plistPath ? plistExists : present.has(String(p))),
    };
  }

  it('reads the LaunchAgent plist and verifies the script exists', () => {
    const r = readRegisteredJob({ entryName: 'cmk-daily-distill', ...macDeps() });
    expect(r.verdict).toBe('ok');
    expect(r.targetPath).toBe(SCRIPT_MAC);
  });

  it('FAILS as target-missing when the registered script is gone', () => {
    expect(readRegisteredJob({ entryName: 'cmk-daily-distill', ...macDeps({ present: new Set() }) }).verdict).toBe('target-missing');
  });

  it('reports not-registered when the plist is absent', () => {
    expect(readRegisteredJob({ entryName: 'cmk-daily-distill', ...macDeps({ plistExists: false }) }).verdict).toBe('not-registered');
  });

  it('is UNREADABLE when the plist exists but cannot be read', () => {
    expect(readRegisteredJob({ entryName: 'cmk-daily-distill', ...macDeps({ plist: null }) }).verdict).toBe('unreadable');
  });
});

describe('readRegisteredJob — an unsupported platform', () => {
  it('is UNREADABLE, never a verdict it has no way to reach', () => {
    const r = readRegisteredJob({
      entryName: 'cmk-daily-distill',
      platform: 'freebsd',
      spawn: () => { throw new Error('must not spawn'); },
      readFile: () => { throw new Error('must not read'); },
      exists: () => false,
    });
    expect(r.verdict).toBe('unreadable');
  });
});
