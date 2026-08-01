// @doors: 1, 3
// Door 2 N/A: pure decision logic — no disk/audit state mutated.
// Door 4 N/A: the auto-approver emits no NDJSON log (fail-silent by design).
// Door 5 N/A: no message-queue interaction.

// Tests for Task 172 — the PermissionRequest auto-approve handler that makes
// the kit's own MCP tools + skills prompt-free on Claude Code 2.1.x (the
// v0.4.1 cut-gate fix). Boundary: evaluatePermissionRequest(payload) decides
// allow-or-stay-silent; the bin (cmk-approve-permission) wires stdin→decision
// →stdout. Assert the PUBLIC contract: what gets approved, what does NOT, and
// that the bin emits the documented allow envelope (Door 3, real spawn).

import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  evaluatePermissionRequest,
  ALLOW_DECISION,
} from '../packages/cli/src/approve-permission.mjs';

const __filename = fileURLToPath(import.meta.url);
const BIN = join(
  dirname(__filename),
  '..',
  'packages',
  'cli',
  'bin',
  'cmk-approve-permission.mjs',
);

describe('Task 172 — evaluatePermissionRequest (Door 1: decision contract)', () => {
  it('APPROVES every kit MCP tool (mcp__cmk__*)', () => {
    for (const tool of [
      'mcp__cmk__mk_remember',
      'mcp__cmk__mk_search',
      'mcp__cmk__mk_lessons_promote',
      'mcp__cmk__mk_forget',
      'mcp__cmk__mk_queue_resolve',
    ]) {
      expect(evaluatePermissionRequest({ tool_name: tool })).toEqual(ALLOW_DECISION);
    }
  });

  it('APPROVES the kit skills via the Skill(<name>) tool-name form', () => {
    expect(evaluatePermissionRequest({ tool_name: 'Skill(memory-write)' })).toEqual(
      ALLOW_DECISION,
    );
    expect(evaluatePermissionRequest({ tool_name: 'Skill(memory-search)' })).toEqual(
      ALLOW_DECISION,
    );
    expect(evaluatePermissionRequest({ tool_name: 'Skill(troubleshooting)' })).toEqual(
      ALLOW_DECISION,
    );
  });

  it('APPROVES the kit skills via the tool_input.name form (payload-shape robustness)', () => {
    expect(
      evaluatePermissionRequest({ tool_name: 'Skill', tool_input: { name: 'memory-write' } }),
    ).toEqual(ALLOW_DECISION);
    expect(
      evaluatePermissionRequest({ tool_name: 'Skill', tool_input: { skill: 'memory-search' } }),
    ).toEqual(ALLOW_DECISION);
    expect(
      evaluatePermissionRequest({ tool_name: 'Skill', tool_input: { name: 'troubleshooting' } }),
    ).toEqual(ALLOW_DECISION);
  });

  it('emits the EXACT decision envelope Claude Code expects', () => {
    expect(ALLOW_DECISION).toEqual({
      hookSpecificOutput: {
        hookEventName: 'PermissionRequest',
        decision: { behavior: 'allow' },
      },
    });
  });

  // The safety boundary — the handler must NEVER approve anything that isn't
  // the kit's own surface, even though the matcher is the first narrowing.
  it('does NOT approve a non-kit MCP server', () => {
    expect(evaluatePermissionRequest({ tool_name: 'mcp__github__create_pr' })).toBeNull();
    expect(evaluatePermissionRequest({ tool_name: 'mcp__brave-search__search' })).toBeNull();
  });

  it('does NOT approve a non-kit skill', () => {
    expect(evaluatePermissionRequest({ tool_name: 'Skill(deploy)' })).toBeNull();
    expect(
      evaluatePermissionRequest({ tool_name: 'Skill', tool_input: { name: 'some-other-skill' } }),
    ).toBeNull();
  });

  it('does NOT approve built-in tools (Bash / Edit / Write)', () => {
    for (const tool of ['Bash', 'Edit', 'Write', 'ExitPlanMode']) {
      expect(evaluatePermissionRequest({ tool_name: tool })).toBeNull();
    }
  });

  it('does NOT approve a near-miss server prefix (mcp__cmkX__) — guards substring slop', () => {
    expect(evaluatePermissionRequest({ tool_name: 'mcp__cmkevil__steal' })).toBeNull();
  });

  // Security regression (code-review finding): the tool_input.name/skill shape
  // must be trusted ONLY for an actual Skill-tool request. A non-Skill tool
  // (Bash/Edit/…) whose tool_input merely CARRIES {name:"memory-write"} must
  // NOT be auto-approved — otherwise the bin's self-check (the second layer of
  // defence-in-depth) has a hole a loose/future matcher could drive through.
  it('does NOT approve a non-Skill tool that spoofs a kit skill name in tool_input', () => {
    expect(
      evaluatePermissionRequest({ tool_name: 'Bash', tool_input: { name: 'memory-write' } }),
    ).toBeNull();
    expect(
      evaluatePermissionRequest({ tool_name: 'Edit', tool_input: { skill: 'memory-search' } }),
    ).toBeNull();
    expect(
      evaluatePermissionRequest({
        tool_name: 'mcp__other__x',
        tool_input: { skillName: 'memory-write' },
      }),
    ).toBeNull();
  });

  it('does NOT approve a bare tool_name equal to a skill name (undocumented shape)', () => {
    // `tool_name: "memory-write"` is not the documented Skill(<name>) form;
    // matching it would risk approving any unrelated tool sharing the name.
    expect(evaluatePermissionRequest({ tool_name: 'memory-write' })).toBeNull();
    expect(evaluatePermissionRequest({ tool_name: 'memory-search' })).toBeNull();
  });

  it('stays silent (null) on a malformed / empty payload', () => {
    expect(evaluatePermissionRequest(null)).toBeNull();
    expect(evaluatePermissionRequest(undefined)).toBeNull();
    expect(evaluatePermissionRequest({})).toBeNull();
    expect(evaluatePermissionRequest({ tool_name: 123 })).toBeNull();
  });
});

describe('Task 172 — cmk-approve-permission bin (Door 3: real stdin→stdout)', () => {
  function runBin(stdin) {
    return spawnSync(process.execPath, [BIN], { input: stdin, encoding: 'utf8' });
  }

  it('prints the allow envelope on stdout for a kit MCP tool', () => {
    const r = runBin(JSON.stringify({ tool_name: 'mcp__cmk__mk_remember' }));
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(ALLOW_DECISION);
  });

  it('prints the allow envelope for a kit skill', () => {
    const r = runBin(JSON.stringify({ tool_name: 'Skill(memory-write)' }));
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout)).toEqual(ALLOW_DECISION);
  });

  it('prints NOTHING (no opinion) for a non-kit tool — exits 0', () => {
    const r = runBin(JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'rm -rf /' } }));
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('');
  });

  it('fail-silent on unparseable stdin — empty stdout, exit 0', () => {
    const r = runBin('not json at all {{{');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('');
  });

  it('fail-silent on empty stdin — empty stdout, exit 0', () => {
    const r = runBin('');
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe('');
  });
});
