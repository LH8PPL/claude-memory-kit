// @doors: 1, 2, 3
// Door 4 N/A: the binding probe + install-ask path emit console output, not
//   NDJSON logs (doctor results are the observability surface, pinned here).
// Door 5 N/A: no message-queue.

// Tests for Task 141a — npm v12 readiness, phase (a) mitigation (D-129/D-133).
//
// npm 12 (~July 2026) flips allowScripts OFF by default: dependency install
// scripts — INCLUDING the implicit node-gyp build that better-sqlite3's
// binding needs — silently don't run on a fresh `npm install -g`. The kit
// then looks installed but `cmk search`/reindex crash at first use.
//
// The mitigation's UX contract (the user's 2026-06-12 steer: "when you
// install you ask the user, not a secondary command after"):
//   1. `cmk install` probes the binding UP FRONT and asks to fix inline.
//   2. The --with-semantic runner passes --allow-scripts=onnxruntime-node
//      itself when the npm version supports the config (≥ 11.16).
//   3. `cmk doctor` HC-8 is the BACKSTOP, not the primary UX.
//
// Remediation commands verified against the primary sources 2026-06-12:
// GitHub changelog "Upcoming breaking changes for npm v12" + npm v11 config
// docs ("allow-scripts … intended for one-off and global contexts: npm
// exec, npx, and npm install -g").

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  checkKitBinding,
  checkEmbedderBinding,
  npmSupportsAllowScripts,
  KIT_BINDING_REMEDY,
  EMBEDDER_BINDING_REMEDY,
} from '../packages/cli/src/native-binding.mjs';
import { runDoctor } from '../packages/cli/src/doctor.mjs';
import { install, buildDefaultNpmRunner } from '../packages/cli/src/install.mjs';
import { runInstall } from '../packages/cli/src/subcommands.mjs';

let sandbox;
let projectRoot;
let userDir;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-native-binding-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  mkdirSync(projectRoot, { recursive: true });
});

afterEach(() => rmSync(sandbox, { recursive: true, force: true }));

const brokenRequire = () => {
  throw new Error("Could not locate the bindings file. Tried: ...better_sqlite3.node");
};

describe('Task 141a — checkKitBinding (Door 1)', () => {
  it('reports ok on a healthy better-sqlite3 (the repo dev tree)', () => {
    const r = checkKitBinding();
    expect(r.ok).toBe(true);
  });

  it('classifies a require failure as broken, with the global allow-scripts remedy', () => {
    const r = checkKitBinding({ requireImpl: brokenRequire });
    expect(r.ok).toBe(false);
    expect(r.reason).toContain('bindings file');
    expect(r.remedy).toBe(KIT_BINDING_REMEDY);
    expect(KIT_BINDING_REMEDY).toBe(
      'npm install -g @lh8ppl/core-memory-kit --allow-scripts=better-sqlite3',
    );
  });
});

describe('Task 141a — checkEmbedderBinding (Door 1)', () => {
  it('distinguishes not-installed from installed-but-broken', async () => {
    const notInstalled = await checkEmbedderBinding({
      importImpl: async () => {
        const e = new Error("Cannot find package '@huggingface/transformers'");
        e.code = 'ERR_MODULE_NOT_FOUND';
        throw e;
      },
    });
    expect(notInstalled.ok).toBe(false);
    expect(notInstalled.installed).toBe(false);

    const broken = await checkEmbedderBinding({
      importImpl: async () => {
        throw new Error('onnxruntime_binding.node was compiled against a different Node.js version');
      },
    });
    expect(broken.ok).toBe(false);
    expect(broken.installed).toBe(true);
    expect(broken.remedy).toBe(EMBEDDER_BINDING_REMEDY);
    expect(EMBEDDER_BINDING_REMEDY).toBe(
      'npm install -g @huggingface/transformers --allow-scripts=onnxruntime-node',
    );
  });

  it('reports ok when the import succeeds', async () => {
    const r = await checkEmbedderBinding({ importImpl: async () => ({}) });
    expect(r.ok).toBe(true);
  });
});

describe('Task 141a — npmSupportsAllowScripts (Doors 1+3)', () => {
  const spawnReturning = (stdout) => {
    const calls = [];
    const impl = (cmd, opts) => {
      calls.push({ cmd, opts });
      return { status: 0, stdout };
    };
    impl.calls = calls;
    return impl;
  };

  it('true at and above npm 11.16.0', () => {
    expect(npmSupportsAllowScripts({ spawnSyncImpl: spawnReturning('11.16.0\n') }).supported).toBe(true);
    expect(npmSupportsAllowScripts({ spawnSyncImpl: spawnReturning('12.0.1\n') }).supported).toBe(true);
  });

  it('false below 11.16.0 and on probe failure (conservative)', () => {
    expect(npmSupportsAllowScripts({ spawnSyncImpl: spawnReturning('11.4.2\n') }).supported).toBe(false);
    expect(npmSupportsAllowScripts({ spawnSyncImpl: spawnReturning('10.9.0\n') }).supported).toBe(false);
    const failing = () => ({ status: 1, stdout: '' });
    expect(npmSupportsAllowScripts({ spawnSyncImpl: failing }).supported).toBe(false);
  });
});

describe('Task 141a — doctor HC-8, the backstop (Doors 1+2)', () => {
  it('passes on a healthy binding (13 checks total now — HC-13 stray-tier backstop added in Task 248)', async () => {
    await install({ projectRoot, userTier: userDir });
    const r = await runDoctor({ projectRoot, userDir });
    expect(r.checks.length).toBe(13);
    const hc8 = r.checks.find((c) => c.id === 'HC-8');
    expect(hc8).toBeTruthy();
    expect(hc8.status).toBe('pass');
  });

  it('fails with the remedy + requiresInstall when the kit binding is broken', async () => {
    await install({ projectRoot, userTier: userDir });
    const r = await runDoctor({
      projectRoot,
      userDir,
      kitBindingProbe: () => ({ ok: false, reason: 'bindings file missing', remedy: KIT_BINDING_REMEDY }),
    });
    const hc8 = r.checks.find((c) => c.id === 'HC-8');
    expect(hc8.status).toBe('fail');
    expect(hc8.recoveryCommand).toBe(KIT_BINDING_REMEDY);
    expect(hc8.requiresInstall).toBe(true);
    expect(hc8.message).toContain('npm 12');
  });

  it('checks the embedder only when semantic is configured', async () => {
    await install({ projectRoot, userTier: userDir });
    const embedderProbe = async () => ({
      ok: false,
      installed: true,
      reason: 'onnx binding broken',
      remedy: EMBEDDER_BINDING_REMEDY,
    });

    // Not configured → embedder ignored, HC-8 passes on the kit binding alone.
    const before = await runDoctor({ projectRoot, userDir, embedderBindingProbe: embedderProbe });
    expect(before.checks.find((c) => c.id === 'HC-8').status).toBe('pass');

    // Configured hybrid → the broken embedder fails HC-8 with its remedy.
    const settingsPath = join(projectRoot, 'context', 'settings.json');
    writeFileSync(settingsPath, JSON.stringify({ search: { default_mode: 'hybrid' } }), 'utf8');
    const after = await runDoctor({ projectRoot, userDir, embedderBindingProbe: embedderProbe });
    const hc8 = after.checks.find((c) => c.id === 'HC-8');
    expect(hc8.status).toBe('fail');
    expect(hc8.recoveryCommand).toBe(EMBEDDER_BINDING_REMEDY);
  });
});

describe('Task 141a — install probes the binding up front (Doors 1+2)', () => {
  it('a healthy probe lands in the install result', async () => {
    const r = await install({ projectRoot, userTier: userDir });
    expect(r.nativeBinding).toBeTruthy();
    expect(r.nativeBinding.ok).toBe(true);
  });

  it('a broken probe is reported in the result without failing the scaffold', async () => {
    const r = await install({
      projectRoot,
      userTier: userDir,
      bindingProbe: () => ({ ok: false, reason: 'blocked', remedy: KIT_BINDING_REMEDY }),
    });
    expect(r.nativeBinding.ok).toBe(false);
    expect(r.errors.length).toBe(0); // scaffold + hooks still complete
  });
});

describe('Task 141a — the install-time ask (the user steer; Doors 1+2+3)', () => {
  function wired({ answer, fixStatus = 0, reProbeOk = true }) {
    const out = [];
    const fixCalls = [];
    return {
      out,
      fixCalls,
      options: {
        cwd: projectRoot,
        userTier: userDir,
        log: (m) => out.push(String(m)),
        logError: (m) => out.push(String(m)),
        bindingProbe: () => ({ ok: false, reason: 'bindings file missing', remedy: KIT_BINDING_REMEDY }),
        askImpl: async (question) => {
          out.push(`ASKED: ${question}`);
          return answer;
        },
        fixRunner: (cmd) => {
          fixCalls.push(cmd);
          return { status: fixStatus };
        },
        reProbe: () => (reProbeOk ? { ok: true } : { ok: false, reason: 'still broken', remedy: KIT_BINDING_REMEDY }),
      },
    };
  }

  it('yes → runs the exact remedy command (Door 3) and confirms the fix', async () => {
    const t = wired({ answer: 'y' });
    await runInstall(t.options);
    expect(t.out.join('\n')).toContain('ASKED:');
    expect(t.fixCalls).toEqual([KIT_BINDING_REMEDY]);
    expect(t.out.join('\n')).toMatch(/binding (fixed|healthy|rebuilt)/i);
  });

  it('no → does not run anything; prints the command for later', async () => {
    const t = wired({ answer: 'n' });
    await runInstall(t.options);
    expect(t.fixCalls).toEqual([]);
    expect(t.out.join('\n')).toContain(KIT_BINDING_REMEDY);
  });

  it('fix ran but the re-probe still fails → honest report, command repeated', async () => {
    const t = wired({ answer: 'y', reProbeOk: false });
    await runInstall(t.options);
    expect(t.fixCalls).toEqual([KIT_BINDING_REMEDY]);
    expect(t.out.join('\n')).toMatch(/still/i);
  });

  it('no askImpl + no TTY → non-interactive: prints the command, never hangs', async () => {
    const out = [];
    await runInstall({
      cwd: projectRoot,
      userTier: userDir,
      log: (m) => out.push(String(m)),
      logError: (m) => out.push(String(m)),
      bindingProbe: () => ({ ok: false, reason: 'blocked', remedy: KIT_BINDING_REMEDY }),
      interactive: false,
    });
    expect(out.join('\n')).toContain(KIT_BINDING_REMEDY);
  });

  it('healthy binding → no ask, no fix, no binding output (Door 2: nothing extra)', async () => {
    const out = [];
    const fixCalls = [];
    await runInstall({
      cwd: projectRoot,
      userTier: userDir,
      log: (m) => out.push(String(m)),
      logError: (m) => out.push(String(m)),
      bindingProbe: () => ({ ok: true }),
      askImpl: async () => {
        throw new Error('must not ask when healthy');
      },
      fixRunner: (cmd) => {
        fixCalls.push(cmd);
        return { status: 0 };
      },
    });
    expect(fixCalls).toEqual([]);
    expect(out.join('\n')).not.toContain('--allow-scripts');
  });
});

describe('Task 141a — the --with-semantic runner passes the allow flag on npm ≥ 11.16 (Door 3)', () => {
  function spawnRecorder({ npmVersion }) {
    const calls = [];
    const impl = (cmd, opts) => {
      calls.push({ cmd, opts });
      if (String(cmd).includes('--version')) return { status: 0, stdout: `${npmVersion}\n` };
      return { status: 0 };
    };
    impl.calls = calls;
    return impl;
  }

  it('appends --allow-scripts=onnxruntime-node when supported', () => {
    const spawn = spawnRecorder({ npmVersion: '12.0.0' });
    const runner = buildDefaultNpmRunner({ spawnSyncImpl: spawn });
    const r = runner();
    expect(r.status).toBe(0);
    const installCall = spawn.calls.find((c) => String(c.cmd).includes('install'));
    expect(installCall.cmd).toBe(
      'npm install -g @huggingface/transformers --allow-scripts=onnxruntime-node',
    );
  });

  it('keeps the plain command on older npm (no unknown-config noise)', () => {
    const spawn = spawnRecorder({ npmVersion: '11.4.2' });
    const runner = buildDefaultNpmRunner({ spawnSyncImpl: spawn });
    runner();
    const installCall = spawn.calls.find((c) => String(c.cmd).includes('install'));
    expect(installCall.cmd).toBe('npm install -g @huggingface/transformers');
  });
});
