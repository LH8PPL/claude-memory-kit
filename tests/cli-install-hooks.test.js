// @doors: 1, 2, 3, 4
// Door 5 N/A: no message-queue interaction.

// Tests for Task 49 — unify install: `cmk install` wires the npm-route
// hooks into <projectRoot>/.claude/settings.json so a tester only needs
// `npm install -g @lh8ppl/core-memory-kit && cmk install` (no separate
// `/plugin install` step). Per tasks.md 49.5:
//   - `cmk install` writes settings.json with all 5 hooks at PATH-resolved
//     (not ${CLAUDE_PLUGIN_ROOT}) commands; idempotent re-run is a no-op
//   - the 5 hook bins are declared in package.json bin (covered in
//     release-verification.test.js) + this file spawn-smokes one
//   - spawn-smoke: a hook bin invoked via node exits cleanly with a
//     parseable hook envelope
//
// Boundary-test discipline: assert the install() + writeKitHooks() public
// contracts (what lands in settings.json, what the result reports, what a
// re-run does, what an audit entry records) — not the internal merge
// helpers.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { install } from '../packages/cli/src/install.mjs';
import {
  writeKitHooks,
  writeKitMcpServer,
  KIT_HOOKS_BLOCK,
  KIT_COMMAND_TOKENS,
} from '../packages/cli/src/settings-hooks.mjs';
import { readAuditLog } from '../packages/cli/src/audit-log.mjs';
import { stripBom } from '../packages/cli/src/read-json.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = join(dirname(__filename), '..');
const BIN_DIR = join(REPO_ROOT, 'packages', 'cli', 'bin');

const EXPECTED_EVENTS = [
  'PermissionRequest',
  'PreToolUse',
  'SessionStart',
  'UserPromptSubmit',
  'PostToolUse',
  'Stop',
  'SessionEnd',
  'PreCompact', // Task 235 — the roll trigger that fires DURING a long session
];
const EXPECTED_COMMANDS = {
  PermissionRequest: 'cmk-approve-permission',
  PreToolUse: 'cmk-guard-memory',
  SessionStart: 'cmk-inject-context',
  UserPromptSubmit: 'cmk-capture-prompt',
  PostToolUse: 'cmk-observe-edit',
  Stop: 'cmk-capture-turn',
  SessionEnd: 'cmk-compress-session',
  PreCompact: 'cmk-precompact',
};

let sandbox;
let projectRoot;
let userTier;
let settingsPath;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'cmk-install-hooks-'));
  projectRoot = join(sandbox, 'proj');
  userTier = join(sandbox, 'user');
  settingsPath = join(projectRoot, '.claude', 'settings.json');
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('Task 49 — cmk install wires hooks (Door 1: result contract)', () => {
  it('reports hooks.action === "wired" + the 8 events on a fresh install', async () => {
    const r = await install({ projectRoot, userTier });
    expect(r.hooks.action).toBe('wired');
    expect(r.hooks.path).toBe(settingsPath);
    expect(r.hooks.events).toEqual(EXPECTED_EVENTS);
    expect(r.errors).toEqual([]);
  });

  it('reports hooks.action === "unchanged" on idempotent re-run', async () => {
    await install({ projectRoot, userTier });
    const second = await install({ projectRoot, userTier });
    expect(second.hooks.action).toBe('unchanged');
  });

  it('--no-hooks (noHooks:true) skips wiring: action "skipped", no settings.json', async () => {
    const r = await install({ projectRoot, userTier, noHooks: true });
    expect(r.hooks.action).toBe('skipped');
    expect(existsSync(settingsPath)).toBe(false);
  });
});

describe('Task 49 — settings.json content (Door 2: state)', () => {
  it('writes all 8 hooks at PATH-resolved bare bin names — NOT ${CLAUDE_PLUGIN_ROOT}, NO bash wrapper', async () => {
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    for (const event of EXPECTED_EVENTS) {
      const cmd = settings.hooks[event][0].hooks[0].command;
      expect(cmd).toBe(EXPECTED_COMMANDS[event]);
    }
    const blob = JSON.stringify(settings.hooks);
    expect(blob).not.toContain('CLAUDE_PLUGIN_ROOT');
    expect(blob).not.toContain('bash ');
  });

  it('allow-lists Bash(cmk:*) + Skill(memory-write) in permissions.allow, idempotently + preserving the user list (Task 79 + 90)', async () => {
    // First write → permissions.allow gains BOTH the bash rule (so explicit cmk
    // captures don't trip the "Allow this bash command?" prompt — Task 79) AND
    // the skill rule (so a model-invoked /memory-write doesn't trip the "Use
    // skill?" prompt — Task 90; Task 69 made the skill the capture path, which
    // has its OWN approval gate the bash rule doesn't cover).
    const r1 = writeKitHooks(settingsPath);
    expect(r1.changed).toBe(true);
    let settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.permissions.allow).toContain('Bash(cmk:*)');
    expect(settings.permissions.allow).toContain('Skill(memory-write)');
    // Task 169 — Claude Code 2.1.x needs the `:*` wildcard form TOO, or the bare
    // `Skill(memory-write)` alone no longer suppresses the prompt (the v0.4.1
    // cut-gate find: CC itself wrote BOTH forms when the user clicked "allow").
    expect(settings.permissions.allow).toContain('Skill(memory-write:*)');
    // Task 133 — the RECALL skill needs the same treatment (the Task-90 class
    // repeating: Task 75.1 scaffolded memory-search but never allow-listed it,
    // so W1's "auto-fires, prompt-free" hit a "Use skill?" prompt — found by
    // the cut-gate9 pre-session file check, 2026-06-11).
    expect(settings.permissions.allow).toContain('Skill(memory-search)');
    expect(settings.permissions.allow).toContain('Skill(memory-search:*)'); // Task 169
    // Task 250 — the troubleshooting skill gets the same allow-list treatment.
    expect(settings.permissions.allow).toContain('Skill(troubleshooting)');
    expect(settings.permissions.allow).toContain('Skill(troubleshooting:*)');
    // Task 108b — the MCP tools are allow-listed too (R2 / D-80): the model's
    // memory ops via mk_remember / mk_forget / … run without a per-call prompt.
    expect(settings.permissions.allow).toContain('mcp__cmk__*');
    // Task 171 (v0.4.1 cut-gate ground-truth): the `mcp__cmk__*` WILDCARD does NOT
    // suppress the per-tool approval prompt on Claude Code 2.1.x — CC prompts for
    // `mcp__cmk__mk_remember` and writes the SPECIFIC name when allowed. So the kit
    // must allow-list each specific MCP tool, not just the wildcard.
    expect(settings.permissions.allow).toContain('mcp__cmk__mk_remember');
    expect(settings.permissions.allow).toContain('mcp__cmk__mk_search');
    expect(settings.permissions.allow).toContain('mcp__cmk__mk_forget');
    // all 11 specific cmk MCP tools must be present
    const { MCP_AUTO_APPROVE } = await import('../packages/cli/src/kiro-constants.mjs');
    for (const tool of MCP_AUTO_APPROVE) {
      expect(settings.permissions.allow).toContain(`mcp__cmk__${tool}`);
    }

    // Idempotent: a second write doesn't duplicate any (over-mutation guard).
    writeKitHooks(settingsPath);
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.permissions.allow.filter((a) => a === 'Bash(cmk:*)')).toHaveLength(1);
    expect(settings.permissions.allow.filter((a) => a === 'Skill(memory-write)')).toHaveLength(1);
    expect(settings.permissions.allow.filter((a) => a === 'Skill(memory-search)')).toHaveLength(1);
    expect(settings.permissions.allow.filter((a) => a === 'Skill(troubleshooting)')).toHaveLength(1);
    expect(settings.permissions.allow.filter((a) => a === 'mcp__cmk__*')).toHaveLength(1);

    // Over-mutation: a user's pre-existing allow entry survives.
    settings.permissions.allow.push('Bash(npm test)');
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    writeKitHooks(settingsPath);
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.permissions.allow).toContain('Bash(npm test)');
    expect(settings.permissions.allow).toContain('Bash(cmk:*)');
    expect(settings.permissions.allow).toContain('Skill(memory-write)');
  });

  it('pre-approves the kit MCP server via enabledMcpjsonServers, idempotently + preserving the user list (Task 172)', () => {
    // The SERVER-approval gate: CC prompts before using a project `.mcp.json`
    // server unless it's named in enabledMcpjsonServers. We name ONLY "cmk"
    // (not enableAllProjectMcpServers, which would blanket-approve every server).
    const r1 = writeKitHooks(settingsPath);
    expect(r1.changed).toBe(true);
    let settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.enabledMcpjsonServers).toContain('cmk');
    // Never the blanket form — that would be a security over-reach for a kit.
    expect(settings.enableAllProjectMcpServers).toBeUndefined();

    // Idempotent: a second write doesn't duplicate "cmk".
    writeKitHooks(settingsPath);
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.enabledMcpjsonServers.filter((s) => s === 'cmk')).toHaveLength(1);

    // Over-mutation: a user's pre-existing approved server survives.
    settings.enabledMcpjsonServers.push('github');
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    writeKitHooks(settingsPath);
    settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.enabledMcpjsonServers).toContain('github');
    expect(settings.enabledMcpjsonServers).toContain('cmk');
  });

  it('wires the PermissionRequest auto-approver with BOTH matchers (mcp__cmk__.* + Skill) → cmk-approve-permission (Task 172)', async () => {
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    const pr = settings.hooks.PermissionRequest;
    expect(Array.isArray(pr)).toBe(true);
    const matchers = pr.map((e) => e.matcher).sort();
    expect(matchers).toEqual(['Skill', 'mcp__cmk__.*']);
    for (const entry of pr) {
      expect(entry.hooks[0].command).toBe('cmk-approve-permission');
    }
  });

  it('uses SHELL form — no `args` key (exec form would break on Windows npm .cmd shims)', async () => {
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    for (const event of EXPECTED_EVENTS) {
      expect(settings.hooks[event][0].hooks[0].args).toBeUndefined();
    }
  });

  it('PostToolUse carries the Write|Edit|MultiEdit matcher + async:true', async () => {
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks.PostToolUse[0].matcher).toBe('Write|Edit|MultiEdit');
    expect(settings.hooks.PostToolUse[0].hooks[0].async).toBe(true);
  });

  it('does NOT register a Setup hook (cmk-version-check is plugin-route only)', async () => {
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks.Setup).toBeUndefined();
    expect(JSON.stringify(settings.hooks)).not.toContain('cmk-version-check');
  });

  it('idempotent: second install leaves settings.json byte-identical', async () => {
    await install({ projectRoot, userTier });
    const first = readFileSync(settingsPath, 'utf8');
    await install({ projectRoot, userTier });
    const second = readFileSync(settingsPath, 'utf8');
    expect(second).toBe(first);
  });

  it('over-mutation guard: preserves a user-authored hook + non-hook keys', async () => {
    // Seed a settings.json with the user's own hook + an unrelated key.
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({
        model: 'claude-opus-4-8',
        hooks: {
          SessionStart: [{ hooks: [{ type: 'command', command: 'my-own-hook.sh' }] }],
          PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'guard.sh' }] }],
        },
      }),
      'utf8',
    );
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    // Unrelated top-level key preserved
    expect(settings.model).toBe('claude-opus-4-8');
    // User's own non-kit hook preserved alongside the kit's
    const ssCommands = JSON.stringify(settings.hooks.SessionStart);
    expect(ssCommands).toContain('my-own-hook.sh');
    expect(ssCommands).toContain('cmk-inject-context');
    // User's PreToolUse guard is PRESERVED alongside the kit's own
    // cmk-guard-memory (the kit now manages PreToolUse for the delete-guardrail,
    // D-192 — and coexists with a user's existing PreToolUse hook).
    const preCommands = JSON.stringify(settings.hooks.PreToolUse);
    expect(preCommands).toContain('guard.sh'); // user's own — untouched
    expect(preCommands).toContain('cmk-guard-memory'); // the kit's guardrail added
  });

  it('prunes a stale plugin-form Setup → cmk-version-check the npm route no longer emits', async () => {
    // A project whose settings.json carries a leftover Setup hook from a
    // pre-0.1.1 `cmk repair --hooks` (plugin form, 6 events incl. Setup)
    // must have it REMOVED on install — on the npm route there is no
    // ${CLAUDE_PLUGIN_ROOT}/bash, so that hook would fail every session.
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({
        hooks: {
          Setup: [{ hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/cmk-version-check"', timeout: 30 }] }],
        },
      }),
      'utf8',
    );
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks.Setup).toBeUndefined();
    expect(JSON.stringify(settings.hooks)).not.toContain('cmk-version-check');
    // ...and the 5 real hooks are present
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('cmk-inject-context');
  });

  it('does NOT touch a purely-user event (even an empty array the user authored)', async () => {
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({
        hooks: {
          // SubagentStop is NOT kit-managed → its empty user array must be
          // left untouched. (This fixture keeps migrating as the kit adopts
          // events: PreToolUse fell to the delete-guardrail (D-192), then
          // PreCompact to the compaction roll (Task 235). Any event absent
          // from KIT_HOOKS_BLOCK works; the ASSERTION is what matters.)
          SubagentStop: [], // user-authored empty array, no kit entry
          Notification: [{ hooks: [{ type: 'command', command: 'notify-me.sh' }] }],
        },
      }),
      'utf8',
    );
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    // Empty user array preserved (not pruned), unrelated user hook intact
    expect(settings.hooks.SubagentStop).toEqual([]);
    expect(JSON.stringify(settings.hooks.Notification)).toContain('notify-me.sh');
  });

  it('upgrades plugin-form kit hooks to npm-form in place (no duplicate kit entries)', async () => {
    // A project that previously had plugin-route hooks (bash + plugin root)
    // should get them REPLACED by npm-form on `cmk install`, not duplicated.
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(
      settingsPath,
      JSON.stringify({
        hooks: {
          SessionStart: [
            { hooks: [{ type: 'command', command: 'bash "${CLAUDE_PLUGIN_ROOT}/bin/cmk-inject-context"', timeout: 30 }] },
          ],
        },
      }),
      'utf8',
    );
    await install({ projectRoot, userTier });
    const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
    expect(settings.hooks.SessionStart).toHaveLength(1);
    expect(settings.hooks.SessionStart[0].hooks[0].command).toBe('cmk-inject-context');
    expect(JSON.stringify(settings.hooks.SessionStart)).not.toContain('CLAUDE_PLUGIN_ROOT');
  });
});

describe('Task 49 — writeKitHooks boundary (the shared install/repair seam)', () => {
  it('returns {changed:false, error} WITHOUT clobbering an unparseable settings.json', () => {
    mkdirSync(dirname(settingsPath), { recursive: true });
    const broken = '{ this is not valid json ';
    writeFileSync(settingsPath, broken, 'utf8');
    const r = writeKitHooks(settingsPath);
    expect(r.changed).toBe(false);
    expect(r.error).toMatch(/parse error/);
    // File left exactly as the user had it — never silently overwritten.
    expect(readFileSync(settingsPath, 'utf8')).toBe(broken);
  });

  it('wires hooks into a BOM-prefixed (Windows-editor) settings.json — not a false parse error (D-187)', () => {
    mkdirSync(dirname(settingsPath), { recursive: true });
    const BOM = '﻿';
    // a VALID settings.json that merely carries a leading UTF-8 BOM
    writeFileSync(settingsPath, `${BOM}${JSON.stringify({ permissions: { allow: ['Bash(ls)'] } })}`, 'utf8');
    const r = writeKitHooks(settingsPath);
    expect(r.changed).toBe(true); // hooks wired — NOT blocked by the BOM
    expect(r.error).toBeUndefined();
    const settings = JSON.parse(stripBom(readFileSync(settingsPath, 'utf8')));
    expect(settings.hooks).toBeDefined(); // the kit's hooks landed
    expect(settings.permissions.allow).toContain('Bash(ls)'); // user content preserved
  });

  it('KIT_HOOKS_BLOCK + KIT_COMMAND_TOKENS stay in sync with the 8 bins', () => {
    expect(Object.keys(KIT_HOOKS_BLOCK)).toEqual(EXPECTED_EVENTS);
    for (const cmd of Object.values(EXPECTED_COMMANDS)) {
      expect(KIT_COMMAND_TOKENS).toContain(cmd);
    }
  });

  it('drift guard: every command in KIT_HOOKS_BLOCK is a declared bin in package.json', () => {
    // If a hook is added to the block but its bin isn't declared (or vice
    // versa), `cmk install` would write a hook command that doesn't resolve
    // on PATH. Cross-check the block against the actual package.json `bin`.
    const pkg = JSON.parse(
      readFileSync(join(REPO_ROOT, 'packages', 'cli', 'package.json'), 'utf8'),
    );
    const declaredBins = new Set(Object.keys(pkg.bin));
    for (const entries of Object.values(KIT_HOOKS_BLOCK)) {
      for (const entry of entries) {
        for (const h of entry.hooks) {
          expect(
            declaredBins.has(h.command),
            `hook command "${h.command}" is not a declared bin in package.json`,
          ).toBe(true);
        }
      }
    }
  });

  it('writeKitHooks does not leak nested mutations back into the shared KIT_HOOKS_BLOCK', () => {
    // The block is only shallow-frozen; writeKitHooks must deep-clone its
    // entries so a mutation of the written settings can't corrupt the
    // constant for the next call.
    const before = JSON.parse(JSON.stringify(KIT_HOOKS_BLOCK));
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeKitHooks(settingsPath);
    const written = JSON.parse(readFileSync(settingsPath, 'utf8'));
    // Mutate the written structure aggressively...
    written.hooks.SessionStart[0].hooks[0].command = 'HACKED';
    written.hooks.SessionStart[0].hooks[0].timeout = 99999;
    // ...the shared constant is unchanged.
    expect(JSON.parse(JSON.stringify(KIT_HOOKS_BLOCK))).toEqual(before);
  });
});

describe('Task 49 — audit trail (Door 4: observability)', () => {
  it('emits one INSTALL_HOOKS_WIRED audit entry on a fresh install', async () => {
    await install({ projectRoot, userTier });
    const entries = readAuditLog(join(projectRoot, 'context'));
    const wired = entries.filter((e) => e.reasonCode === 'install-hooks-wired');
    expect(wired).toHaveLength(1);
    expect(wired[0].action).toBe('install');
    expect(wired[0].tier).toBe('P');
    expect(wired[0].id).toBe('P-NSTLHKWR');
    expect(wired[0].extra?.events).toEqual(EXPECTED_EVENTS);
  });

  it('emits NO additional audit entry on an idempotent (no-op) re-install', async () => {
    await install({ projectRoot, userTier });
    await install({ projectRoot, userTier });
    const entries = readAuditLog(join(projectRoot, 'context'));
    const wired = entries.filter((e) => e.reasonCode === 'install-hooks-wired');
    // Still exactly one — the no-op re-run must not append (keeps the
    // append-only audit.log from breaking install's byte-idempotency).
    expect(wired).toHaveLength(1);
  });
});

describe('Task 49 — hook bins spawn cleanly (Door 3: external calls)', () => {
  // The real cross-process surface: Claude Code fires a hook by resolving
  // the bare bin name on PATH and running it (shell form). Here we spawn
  // the bin file directly via node (the npm shim's effect) with hook-shaped
  // stdin and assert the envelope contract: exit 0 + parseable JSON. cwd is
  // a context-less temp dir, so handlers take their empty-state path.
  function spawnBin(name, input) {
    return spawnSync(process.execPath, [join(BIN_DIR, name)], {
      input,
      encoding: 'utf8',
      cwd: sandbox,
    });
  }

  it('cmk-inject-context.mjs exits 0 + emits SessionStart hookSpecificOutput JSON', () => {
    const r = spawnBin('cmk-inject-context.mjs', '{}');
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout);
    expect(parsed.hookSpecificOutput?.hookEventName).toBe('SessionStart');
  });

  it('cmk-capture-turn.mjs exits 0 + emits {"continue": true}', () => {
    const r = spawnBin(
      'cmk-capture-turn.mjs',
      JSON.stringify({ hook_event_name: 'Stop', stop_hook_active: false }),
    );
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ continue: true });
  });

  it('cmk-capture-prompt.mjs exits 0 + emits {"continue": true} on empty stdin', () => {
    const r = spawnBin('cmk-capture-prompt.mjs', '');
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ continue: true });
  });
});

describe('Task 108b — cmk install registers the MCP server (.mcp.json) (R2 / D-80)', () => {
  it('writeKitMcpServer writes the cmk stdio server, idempotently, preserving other servers', () => {
    const mcpPath = join(projectRoot, '.mcp.json');
    const r1 = writeKitMcpServer(projectRoot);
    expect(r1.changed).toBe(true);
    expect(r1.path).toBe(mcpPath);
    let config = JSON.parse(readFileSync(mcpPath, 'utf8'));
    // Door 2 — the exact server entry: PATH-resolved `cmk mcp serve` over stdio.
    expect(config.mcpServers.cmk).toEqual({ type: 'stdio', command: 'cmk', args: ['mcp', 'serve'] });

    // Idempotent: a second write is a no-op (Door 1).
    expect(writeKitMcpServer(projectRoot).changed).toBe(false);

    // Over-mutation guard: a user's OTHER server survives a re-write.
    config.mcpServers.other = { type: 'stdio', command: 'foo', args: [] };
    writeFileSync(mcpPath, JSON.stringify(config, null, 2), 'utf8');
    writeKitMcpServer(projectRoot);
    config = JSON.parse(readFileSync(mcpPath, 'utf8'));
    expect(config.mcpServers.other).toBeDefined();
    expect(config.mcpServers.cmk).toBeDefined();
  });

  it('returns {error} on a malformed existing .mcp.json — never clobbers it', () => {
    const mcpPath = join(projectRoot, '.mcp.json');
    mkdirSync(projectRoot, { recursive: true });
    writeFileSync(mcpPath, '{not json', 'utf8');
    const r = writeKitMcpServer(projectRoot);
    expect(r.changed).toBe(false);
    expect(r.error).toMatch(/parse error/);
    expect(readFileSync(mcpPath, 'utf8')).toBe('{not json'); // untouched
  });

  it('install() registers the MCP server + reports mcpServer.action "registered"', async () => {
    const r = await install({ projectRoot, userTier });
    expect(r.mcpServer.action).toBe('registered');
    expect(r.errors).toEqual([]);
    const config = JSON.parse(readFileSync(join(projectRoot, '.mcp.json'), 'utf8'));
    expect(config.mcpServers.cmk.args).toEqual(['mcp', 'serve']);
  });

  it('install({noHooks:true}) skips the MCP registration (no .mcp.json)', async () => {
    const r = await install({ projectRoot, userTier, noHooks: true });
    expect(r.mcpServer.action).toBe('skipped');
    expect(existsSync(join(projectRoot, '.mcp.json'))).toBe(false);
  });
});

// ===========================================================================
// Task 74 — memory re-injects after compaction (verify-and-lock-in, D-218).
//
// The mechanism ALREADY WORKS, unintentionally: the SessionStart hook is
// registered with NO `source`/`matcher`, and Claude Code fires SessionStart with
// source:"compact" after an auto-compaction — so the matcher-less hook re-runs
// cmk-inject-context and re-injects the frozen snapshot post-compact. This was a
// "works by luck, not verified contract" gap (the property was UNasserted). These
// tests LOCK IT IN structurally so a future change can't silently add a `matcher`
// that would stop firing on compact. (A live compaction confirmation is the
// honest manual step — flagged for the cut-gate session; can't be auto-triggered.)
// ===========================================================================

describe('Task 74 — SessionStart re-injects post-compaction (matcher-less hook)', () => {
  it('the SessionStart hook is registered with NO matcher → it fires on EVERY source, including source:"compact"', () => {
    const ss = KIT_HOOKS_BLOCK.SessionStart;
    expect(Array.isArray(ss)).toBe(true);
    expect(ss).toHaveLength(1);
    // A `matcher` on SessionStart would scope it to specific sources and could
    // EXCLUDE source:"compact" — the bug this locks against. There must be none.
    expect(ss[0].matcher).toBeUndefined();
    expect(ss[0].hooks[0].command).toBe('cmk-inject-context');
  });

  it('the installed settings keep SessionStart matcher-less (the compact-survival contract on disk)', async () => {
    await install({ projectRoot, userTier });
    const settingsPath = join(projectRoot, '.claude', 'settings.json');
    const settings = JSON.parse(stripBom(readFileSync(settingsPath, 'utf8')));
    const ss = settings.hooks.SessionStart;
    expect(ss).toHaveLength(1);
    // Same invariant, enforced on the written file: no source matcher.
    expect(ss[0].matcher).toBeUndefined();
    expect(ss[0].hooks[0].command).toBe('cmk-inject-context');
  });
  // The source-agnostic injectContext half (it builds the snapshot regardless of
  // the trigger, so a compact-fired run re-injects) is asserted in
  // cli-inject-context.test.js where the injectContext fixtures live.
});
