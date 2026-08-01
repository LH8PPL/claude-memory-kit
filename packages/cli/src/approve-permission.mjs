// PermissionRequest auto-approve logic — the prompt-free fix (Task 172).
//
// Background (the v0.4.1 cut-gate, 2026-06-27). Claude Code 2.1.x tightened
// permission matching so that neither the kit's `permissions.allow` MCP rules
// (`mcp__cmk__*` + the specific names, Task 171) NOR a skill's `allowed-tools`
// grant reliably suppress the per-tool MCP approval prompt or the "Use skill?"
// prompt — see anthropics/claude-code#17499 (allowed-tools for MCP tools is
// undocumented/unreliable) and #18837 → #14956 (allowed-tools not enforced).
// The popup is a CLAUDE CODE change, not a kit regression: the skill + allow-list
// config has been byte-stable since Task 108/117.
//
// The DOCUMENTED, working mechanism is a `PermissionRequest` hook
// (code.claude.com/docs/en/hooks-guide#auto-approve-specific-permission-prompts):
// it fires when CC is about to show a permission dialog, and a hook that writes
// `{"behavior":"allow"}` answers it on the user's behalf — proven live (v041l):
// the dialog flashes then auto-dismisses, the tool runs, no click required.
//
// This module decides — given the hook payload — whether to auto-approve. It
// approves ONLY the kit's OWN surfaces (its MCP tools + its scaffolded skills),
// never anything else. Two-layer safety: the wired matcher is already narrow
// (`mcp__cmk__.*` / `Skill`), and this self-check is the second layer, so even a
// loose matcher can't make the hook approve a non-kit tool. Returns `null` for
// anything not kit-owned → the hook stays silent → CC's normal permission flow
// runs unchanged.

// The kit's own scaffolded skills (template/.claude/skills/<name>). Keep in sync
// with the Skill(...) entries in settings-hooks.mjs KIT_ALLOW.
const KIT_SKILLS = Object.freeze(['memory-write', 'memory-search', 'troubleshooting']);

// The allow decision shape CC expects on stdout for a PermissionRequest hook.
export const ALLOW_DECISION = Object.freeze({
  hookSpecificOutput: {
    hookEventName: 'PermissionRequest',
    decision: { behavior: 'allow' },
  },
});

/**
 * True iff `toolName` is one of the kit's own MCP tools (any `mcp__cmk__<tool>`).
 */
function isKitMcpTool(toolName) {
  return typeof toolName === 'string' && toolName.startsWith('mcp__cmk__');
}

/**
 * True iff this is an invocation of one of the kit's own scaffolded skills.
 * The Skill tool surfaces the skill name either as the tool name's suffix
 * (`Skill(memory-write)`) or in `tool_input.name`/`tool_input.skill` — accept
 * either shape so a CC payload-format change doesn't silently stop matching.
 *
 * Security boundary: the `tool_input.name`/`skill` fallback is consulted ONLY
 * when `tool_name` identifies the Skill tool (`Skill` or `Skill(...)`). Without
 * that gate, a non-Skill request whose `tool_input` merely happened to carry
 * `{name:"memory-write"}` (e.g. a `Bash` call) would match — defeating the
 * second layer of defence-in-depth (the matcher is the first). We never read
 * `tool_input` for a tool that isn't the Skill tool.
 */
function isKitSkill(toolName, toolInput) {
  if (typeof toolName !== 'string') return false;
  // The documented tool-name form for a skill invocation: `Skill(<name>)`.
  for (const skill of KIT_SKILLS) {
    if (toolName === `Skill(${skill})`) return true;
  }
  // Only trust the tool_input name shape for an actual Skill-tool request.
  // (A bare `tool_name === "<skill>"` is NOT matched — it isn't a documented
  // CC shape and would risk approving any unrelated tool that happened to share
  // the name.)
  if (toolName === 'Skill' || toolName.startsWith('Skill(')) {
    const named = toolInput && (toolInput.name ?? toolInput.skill ?? toolInput.skillName);
    if (typeof named === 'string' && KIT_SKILLS.includes(named)) return true;
  }
  return false;
}

/**
 * Decide whether to auto-approve a PermissionRequest for a kit-owned surface.
 *
 * @param {object} payload - the hook payload from stdin
 *   ({ tool_name, tool_input, ... }).
 * @returns {object|null} the ALLOW_DECISION object to print on stdout, or null
 *   when the request is NOT for a kit surface (the hook emits nothing → CC's
 *   normal permission flow proceeds).
 */
export function evaluatePermissionRequest(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const toolName = payload.tool_name;
  const toolInput = payload.tool_input;
  if (isKitMcpTool(toolName) || isKitSkill(toolName, toolInput)) {
    return ALLOW_DECISION;
  }
  return null;
}
