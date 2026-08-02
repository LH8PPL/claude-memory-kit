// @doors: 1, 2, 3
// Door 4 N/A: no message-queue surface.
// Door 5 N/A: the viewer writes NO kit log at all — the ABSENCE is the contract
//   (design §24.1.3, structurally read-only), so it is ASSERTED rather than
//   waived. In particular a viewer search must not append to `.locks/recall.log`
//   (browse traffic there would corrupt the Task-233/ADR-0024 skill fire-rate
//   measurement). The "no log written / tier unchanged" assertions below are
//   Door 5 in its negative form.
//
// Task 255 — `cmk view`, the kit's read-only memory viewer (design §24, D-414).
//
// Boundary under test: viewer.mjs's ONE public entry —
//   startViewer({projectRoot, userDir, host, port, open, …})
//     → {action:'listening', url, host, port, close} | errorResult
// exercised the way a user exercises it: over REAL HTTP against the real
// server on an ephemeral port. Nothing here reaches into internal helpers.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { install } from '../packages/cli/src/install.mjs';
import { startViewer, LOOPBACK_HOSTS } from '../packages/cli/src/viewer.mjs';
import { subcommands, runView } from '../packages/cli/src/subcommands.mjs';

let sandbox, projectRoot, userDir, server;

async function boot(opts = {}) {
  const r = await startViewer({
    projectRoot,
    userDir,
    open: false,
    log: () => {},
    logError: () => {},
    ...opts,
  });
  if (r.action === 'listening') server = r;
  return r;
}

beforeEach(async () => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-viewer-'));
  projectRoot = join(sandbox, 'proj');
  userDir = join(sandbox, 'user');
  await install({ projectRoot, userTier: userDir });
});

afterEach(async () => {
  if (server) await server.close();
  server = null;
  rmSync(sandbox, { recursive: true, force: true });
});

describe('viewer — server core (255.1)', () => {
  it('binds loopback on a free port and serves the page (Door 1 + Door 2)', async () => {
    const r = await boot();
    expect(r.action).toBe('listening');
    expect(r.host).toBe('127.0.0.1');
    expect(r.port).toBeGreaterThan(0);
    expect(r.url).toBe(`http://127.0.0.1:${r.port}/`);

    const res = await fetch(r.url);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toMatch(/text\/html/);
    const html = await res.text();
    expect(html).toContain('<!doctype html>');
  });

  it('a non-loopback --host is REFUSED with a stated reason, and nothing binds', async () => {
    for (const host of ['0.0.0.0', '192.168.1.20', '::', 'example.com']) {
      const r = await boot({ host });
      expect(r.action).toBe('error');
      expect(r.errorCategory).toBe('schema');
      expect(r.errors.join(' ')).toMatch(/loopback/i);
      // The refusal must NAME the reason (no auth mode exists) rather than
      // just rejecting — the hermes hardening borrow (research §3).
      expect(r.errors.join(' ')).toMatch(/no authentication|no auth/i);
      expect(r.url).toBeUndefined();
    }
  });

  it('accepts every loopback spelling', async () => {
    for (const host of [...LOOPBACK_HOSTS]) {
      const r = await boot({ host });
      expect(r.action).toBe('listening');
      await server.close();
      server = null;
    }
  });

  it('an uninstalled project explains and exits — and NEVER scaffolds', async () => {
    const bare = join(sandbox, 'bare');
    const r = await startViewer({
      projectRoot: bare,
      userDir,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(r.action).toBe('error');
    expect(r.errorCategory).toBe('not-found');
    expect(r.errors.join(' ')).toMatch(/cmk install/);
    // The 250 no-scaffold guard class: a read verb must not create the tier.
    expect(existsSync(join(bare, 'context'))).toBe(false);
    expect(existsSync(bare)).toBe(false);
  });

  it('an explicit --port is honored; two viewers get different free ports', async () => {
    const a = await boot();
    const first = a.port;
    const b = await startViewer({
      projectRoot,
      userDir,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(b.action).toBe('listening');
    expect(b.port).not.toBe(first);
    const pinned = b.port;
    await b.close();

    const c = await startViewer({
      projectRoot,
      userDir,
      port: pinned,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(c.action).toBe('listening');
    expect(c.port).toBe(pinned);
    await c.close();
  });

  it('a port already in use fails with a stated error, not a stack (Door 1)', async () => {
    const a = await boot();
    const r = await startViewer({
      projectRoot,
      userDir,
      port: a.port,
      open: false,
      log: () => {},
      logError: () => {},
    });
    expect(r.action).toBe('error');
    expect(r.errors.join(' ')).toMatch(/in use|EADDRINUSE/i);
  });

  it('Door 3 — the browser is opened via the platform helper, and --no-open suppresses it', async () => {
    const calls = [];
    const spy = (url) => calls.push(url);

    await boot({ open: false, openBrowser: spy });
    expect(calls).toEqual([]);
    await server.close();
    server = null;

    const r = await boot({ open: true, openBrowser: spy });
    expect(calls).toEqual([r.url]);
  });

  it('the URL is printed even when the browser opens (the fallback contract)', async () => {
    const lines = [];
    const r = await boot({ open: true, openBrowser: () => {}, log: (s) => lines.push(String(s)) });
    expect(lines.join('\n')).toContain(r.url);
  });

  it('close() releases the port and is idempotent', async () => {
    const r = await boot();
    await r.close();
    await r.close();
    await expect(fetch(r.url)).rejects.toThrow();
    server = null;
  });

  it('starting the viewer mutates nothing under context/ (read-only, Door 2)', async () => {
    const before = snapshotTier(projectRoot);
    const r = await boot();
    await fetch(r.url);
    const after = snapshotTier(projectRoot);
    // `.index/` is the rebuildable cache the read path refreshes (same as every
    // other read verb); everything else in the tier must be byte-identical.
    expect(after.filter((p) => !p.includes('.index'))).toEqual(
      before.filter((p) => !p.includes('.index')),
    );
  });
});

describe('viewer — the `cmk view` CLI glue (255.1)', () => {
  it('is registered as a verb with the documented flags', () => {
    const sub = subcommands.find((s) => s.name === 'view');
    expect(sub).toBeTruthy();
    const flags = sub.optionSpec.map((o) => o.flags);
    expect(flags).toEqual(
      expect.arrayContaining(['--port <n>', '--host <host>', '--no-open', '--project <dir>']),
    );
    // The description must state the two properties a user needs to trust it.
    expect(sub.description).toMatch(/read-only/i);
    expect(sub.description).toMatch(/127\.0\.0\.1/);
  });

  it('passes cwd + the user tier through, holds nothing when deps.hold is false', async () => {
    const seen = [];
    const r = await runView(
      {},
      undefined,
      {
        hold: false,
        userDir,
        log: () => {},
        logError: () => {},
        startViewer: (o) => {
          seen.push(o);
          return { action: 'listening', url: 'http://127.0.0.1:1/', host: o.host, port: 1, close: async () => {} };
        },
      },
    );
    expect(r.action).toBe('listening');
    expect(seen[0].host).toBe('127.0.0.1');
    expect(seen[0].port).toBe(0);
    expect(seen[0].open).toBe(true);
    expect(seen[0].userDir).toBe(userDir);
    expect(seen[0].signals).toEqual(['SIGINT', 'SIGTERM']);
  });

  it('--no-open reaches the module as open:false', async () => {
    const seen = [];
    await runView({ open: false }, undefined, {
      hold: false,
      log: () => {},
      logError: () => {},
      startViewer: (o) => {
        seen.push(o);
        return { action: 'listening', url: 'u', host: o.host, port: 1, close: async () => {} };
      },
    });
    expect(seen[0].open).toBe(false);
  });

  it('a bad --port is rejected before anything binds (exit 2)', async () => {
    const errs = [];
    let started = false;
    for (const bad of ['abc', '-1', '70000', '80.5']) {
      process.exitCode = 0;
      await runView({ port: bad }, undefined, {
        hold: false,
        log: () => {},
        logError: (e) => errs.push(e),
        startViewer: () => {
          started = true;
          return { action: 'listening', url: 'u', host: 'h', port: 1, close: async () => {} };
        },
      });
      expect(process.exitCode).toBe(2);
    }
    process.exitCode = 0;
    expect(started).toBe(false);
    expect(errs.join(' ')).toMatch(/--port must be an integer/);
  });

  it('an error result becomes a printed reason + exit 2, never a stack', async () => {
    const errs = [];
    process.exitCode = 0;
    await runView({ host: '0.0.0.0', project: projectRoot }, undefined, {
      hold: false,
      log: () => {},
      logError: (e) => errs.push(String(e)),
    });
    expect(process.exitCode).toBe(2);
    process.exitCode = 0;
    expect(errs.join(' ')).toMatch(/cmk view: refusing to bind 0\.0\.0\.0/);
    expect(errs.join(' ')).not.toMatch(/at .*viewer\.mjs/); // no stack
  });
});

function snapshotTier(root) {
  const base = join(root, 'context');
  const out = [];
  const walk = (dir, rel) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const next = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), next);
      else out.push(next);
    }
  };
  if (existsSync(base)) walk(base, '');
  return out.sort();
}
