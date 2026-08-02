// @doors: 1, 5
// Door 2 N/A: the wrapper mutates no kit state of its own — the health.log
//   append IS the state it writes, and that is asserted as Door 5.
// Door 3 N/A: in-process handler invocation; no subprocess.
// Door 4 N/A: MCP is message-passing, but the kit's contract is at the tool
//   -handler boundary; the SDK owns the JSON-RPC envelope.

// Tests for Task 250 (D-412) — the MCP half of the health log.
//
// THE DISTINCTION THIS FILE EXISTS TO PIN, because getting it wrong makes the
// whisper useless in opposite directions:
//
//   a THROWN handler        = the kit is broken           → fail
//   an `isError:true` reply = the tool worked correctly   → ok
//
// `isError` is the documented way a tool reports an ordinary application
// outcome — a not-found id, a Poison_Guard rejection, a search that found
// nothing. Counting those as failures would whisper "your memory tools keep
// erroring" at a user who simply asked for something that isn't there, which is
// exactly the noise the D-412 threshold was designed to eliminate. A thrown
// handler is different in kind: it escapes to the SDK, becomes a JSON-RPC
// error, and leaves NO trace anywhere on disk today — the silent class.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withToolHealth } from '../packages/cli/src/mcp-server.mjs';
import { _resetHealthTransitionState } from '../packages/cli/src/health-log.mjs';

let sandbox;
let projectRoot;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-mcp-health-'));
  projectRoot = join(sandbox, 'proj');
  mkdirSync(join(projectRoot, 'context', '.locks'), { recursive: true });
  // The install marker — the health log refuses to write without it (M2).
  writeFileSync(join(projectRoot, 'context', 'MEMORY.md'), '# MEMORY\n', 'utf8');
  // The MCP seam uses the TRANSITION form (B2), whose per-process memory is
  // module-level and would otherwise carry across cases in this file.
  _resetHealthTransitionState();
});
afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
});

function readHealth() {
  const p = join(projectRoot, 'context', '.locks', 'health.log');
  if (!existsSync(p)) return [];
  return readFileSync(p, 'utf8')
    .split(/\r?\n/)
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

describe('withToolHealth — the MCP tool-handler health seam (Door 5)', () => {
  it('a handler that RETURNS appends mcp-tool-failing:ok and passes the result through unchanged', async () => {
    const payload = { content: [{ type: 'text', text: 'hello' }] };
    const wrapped = withToolHealth(projectRoot, 'mk_search', async () => payload);
    await expect(wrapped({ query: 'x' })).resolves.toBe(payload);
    expect(readHealth()).toMatchObject([{ class: 'mcp-tool-failing', outcome: 'ok', schema: 1 }]);
  });

  it('an isError ENVELOPE is still ok — the tool worked, the answer was "no"', async () => {
    const wrapped = withToolHealth(projectRoot, 'mk_get', async () => ({
      content: [{ type: 'text', text: 'error (not-found): no such id' }],
      isError: true,
    }));
    const r = await wrapped({ id: 'P-AAAAAAAA' });
    expect(r.isError).toBe(true);
    expect(readHealth().map((e) => e.outcome)).toEqual(['ok']);
  });

  it('a THROWN handler appends fail, names the tool, and RE-THROWS unchanged', async () => {
    const boom = new Error('the index db vanished');
    const wrapped = withToolHealth(projectRoot, 'mk_timeline', async () => {
      throw boom;
    });
    await expect(wrapped({})).rejects.toBe(boom); // identity: nothing is swallowed or re-wrapped
    expect(readHealth()).toMatchObject([{ class: 'mcp-tool-failing', outcome: 'fail', detail: 'mk_timeline' }]);
  });

  it('a SYNCHRONOUS throw is recorded too (a handler need not be async to break)', async () => {
    const wrapped = withToolHealth(projectRoot, 'mk_cite', () => {
      throw new Error('sync boom');
    });
    await expect(wrapped({})).rejects.toThrow('sync boom');
    expect(readHealth().map((e) => [e.class, e.outcome])).toEqual([['mcp-tool-failing', 'fail']]);
  });

  it('a broken health log never changes the handler contract (fail-open both ways)', async () => {
    // A DIRECTORY where the log belongs — every append fails.
    mkdirSync(join(projectRoot, 'context', '.locks', 'health.log'), { recursive: true });
    const ok = withToolHealth(projectRoot, 'mk_search', async () => ({ content: [] }));
    await expect(ok({})).resolves.toEqual({ content: [] });
    const bad = withToolHealth(projectRoot, 'mk_search', async () => {
      throw new Error('still thrown');
    });
    await expect(bad({})).rejects.toThrow('still thrown');
  });

  it('is a no-op passthrough when there is no project root to log to', async () => {
    const wrapped = withToolHealth(undefined, 'mk_search', async () => ({ content: [] }));
    await expect(wrapped({})).resolves.toEqual({ content: [] });
  });

  it('forwards every argument the SDK passes (the handler signature is not narrowed)', async () => {
    let seen;
    const wrapped = withToolHealth(projectRoot, 'mk_search', async (...args) => {
      seen = args;
      return { content: [] };
    });
    const extra = { signal: 'abort-ish' };
    await wrapped({ query: 'q' }, extra);
    expect(seen).toEqual([{ query: 'q' }, extra]);
  });
});
