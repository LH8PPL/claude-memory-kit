// settings-hooks.mjs — the canonical npm-route hooks block + the
// read-merge-write logic that wires it into a project's
// <projectRoot>/.claude/settings.json. (Task 49, T-037.)
//
// SINGLE SOURCE OF TRUTH for the npm-route hook wiring. Both
// `cmk install` (install.mjs — the complete npm entry point) and
// `cmk repair --hooks` (repair.mjs) import from here. Before Task 49
// the block lived inline in repair.mjs as `KIT_HOOKS_BLOCK`; it was
// extracted + de-plugin-ified here so install can share it.
//
// ─────────────────────────────────────────────────────────────────────
// Command form: SHELL form (no `args`), bare bin name. WHY (verified
// against Anthropic's hooks docs, https://code.claude.com/docs/en/hooks,
// 2026-05-29):
//
//   - Hook commands with `args` present run in EXEC form (no shell). On
//     Windows, exec form requires `command` to resolve to a REAL
//     executable (.exe) — the docs explicitly warn that the `.cmd`/`.ps1`
//     shims npm installs for `bin` entries "cannot be spawned without a
//     shell". So exec form + a bare `cmk-inject-context` would FAIL on
//     Windows.
//   - Hook commands WITHOUT `args` run in SHELL form: `sh -c "<command>"`
//     on macOS/Linux, Git Bash (or PowerShell) on Windows. The shell
//     resolves the bare name on PATH — picking up npm's global shim on
//     every OS. So we deliberately OMIT `args` and emit a bare bin name.
//
// This is why the block below has no `args` and a bare command string.
// `npm install -g @lh8ppl/core-memory-kit` puts these 5 bins on PATH
// (declared in packages/cli/package.json `bin`); the hook commands then
// resolve the same way `cmk` itself does.
//
// ─────────────────────────────────────────────────────────────────────
// Decision trail (CLAUDE.md "Decision-trail preservation"):
//
//   **Original block (pre-2026-05-29, repair.mjs)**: the PLUGIN form,
//   `bash "${CLAUDE_PLUGIN_ROOT}/bin/<name>"`, 6 events incl. Setup →
//   cmk-version-check. That form required bash to be present. It lives in
//   plugin/hooks/hooks.json for the PLUGIN route (Route B) — and as of
//   Task 62 (2026-05-31) that route was converted to the node form
//   `node "${CLAUDE_PLUGIN_ROOT}/bin/<name>.mjs"`, so BOTH routes are now
//   bash-free (node-only, cross-OS). version-check was ported to a node
//   .mjs stub at that point (see below).
//
//   **Task 49 (2026-05-29)**: the npm route (Route A) needs hooks that
//   work with NO plugin loaded. This block is that form. It drops the
//   Setup → cmk-version-check hook: version-check is a not-yet-implemented
//   bash stub (no node bin ships for it — see tasks.md 49.1, which lists
//   exactly the 5 functional hooks), and `Setup` is not in Anthropic's
//   documented common-events set. Porting version-check to a node bin is
//   a v0.1.x item if a real Setup-time check is wanted. The 5 functional
//   hooks below are the complete auto-memory loop.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { stripBom } from './read-json.mjs';
import { MCP_AUTO_APPROVE } from './kiro-constants.mjs';

/**
 * Canonical npm-route hooks block. Shell form (no `args`), PATH-resolved
 * bare bin names. Keep in sync with packages/cli/package.json `bin` and
 * (modulo command form) plugin/hooks/hooks.json.
 */
export const KIT_HOOKS_BLOCK = Object.freeze({
  // PermissionRequest — the prompt-free auto-approver (Task 172, the v0.4.1
  // cut-gate fix). Fires when Claude Code is about to show a permission dialog
  // for one of the kit's OWN surfaces and answers "allow" so capture/recall stay
  // seamless. Two matchers: the kit's MCP tools (`mcp__cmk__.*`) and the Skill
  // tool (the "Use skill?" prompt). The handler (cmk-approve-permission)
  // self-checks the tool name and approves ONLY kit tools/skills — the matcher
  // is the first narrowing, the handler's check is the second (defence in depth).
  // Needed because CC 2.1.x stopped honouring `permissions.allow` MCP rules +
  // skill `allowed-tools` for these prompts (anthropics/claude-code#17499,
  // #18837→#14956); the PermissionRequest hook is the documented, working path.
  PermissionRequest: [
    { matcher: 'mcp__cmk__.*', hooks: [{ type: 'command', command: 'cmk-approve-permission', timeout: 5 }] },
    { matcher: 'Skill', hooks: [{ type: 'command', command: 'cmk-approve-permission', timeout: 5 }] },
  ],
  // PreToolUse — the memory delete-guardrail (D-192). Blocks a destructive
  // shell command (rm / Remove-Item / git clean …) aimed at a memory path
  // BEFORE it runs. The only kit hook that can exit non-zero (2 = block).
  PreToolUse: [{ matcher: 'Bash|PowerShell', hooks: [{ type: 'command', command: 'cmk-guard-memory', timeout: 5 }] }],
  SessionStart: [{ hooks: [{ type: 'command', command: 'cmk-inject-context', timeout: 30 }] }],
  UserPromptSubmit: [{ hooks: [{ type: 'command', command: 'cmk-capture-prompt', timeout: 10 }] }],
  PostToolUse: [{ matcher: 'Write|Edit|MultiEdit', hooks: [{ type: 'command', command: 'cmk-observe-edit', async: true, timeout: 120 }] }],
  Stop: [{ hooks: [{ type: 'command', command: 'cmk-capture-turn', timeout: 30 }] }],
  SessionEnd: [{ hooks: [{ type: 'command', command: 'cmk-compress-session', timeout: 60 }] }],
  // PreCompact — the THIRD now→today roll trigger (Task 235). SessionEnd fires
  // only on a clean window-close and SessionStart-lazy fires too late for the
  // session that is compacting, so a marathon session had NO roll trigger at all
  // (the Task-105/D-75 class: now.md grew to 410 KB in the v0.4.0 dogfood).
  // No matcher = both `manual` (/compact) and `auto` (context full).
  // The 10s timeout is deliberate and generous: the handler only GATES and
  // spawns a detached worker — it must never run the LLM inline and make the
  // user wait on their own compaction. It also never emits `decision`, so it
  // cannot block compaction (the fail-open posture; docs allow blocking, we
  // refuse it).
  PreCompact: [{ hooks: [{ type: 'command', command: 'cmk-precompact', timeout: 10 }] }],
});

/**
 * Substrings that identify a kit-owned hook entry, so re-runs replace the
 * kit's entries in place while preserving the user's own hooks. Covers
 * BOTH command forms (npm-route bare names AND the plugin-route
 * `${CLAUDE_PLUGIN_ROOT}/bin/<name>` form) so a project that previously
 * had plugin-form kit hooks gets them cleanly upgraded to npm-form rather
 * than duplicated.
 */
export const KIT_COMMAND_TOKENS = Object.freeze([
  'cmk-version-check',
  'cmk-approve-permission',
  'cmk-guard-memory',
  'cmk-inject-context',
  'cmk-capture-prompt',
  'cmk-observe-edit',
  'cmk-capture-turn',
  'cmk-compress-session',
  'cmk-precompact',
]);

/** True if a hooks-array entry references any kit bin. */
function isKitEntry(entry) {
  if (!entry || typeof entry !== 'object') return false;
  const cmds = [];
  if (typeof entry.command === 'string') cmds.push(entry.command);
  if (Array.isArray(entry.hooks)) {
    for (const h of entry.hooks) if (typeof h.command === 'string') cmds.push(h.command);
  }
  return cmds.some((c) => KIT_COMMAND_TOKENS.some((t) => c.includes(t)));
}

/**
 * Read-merge-write the canonical kit hooks block into the settings.json
 * at `settingsPath`. Idempotent. Preserves any non-kit top-level keys and
 * any non-kit hook entries under the same events.
 *
 * Public boundary (install.mjs + repair.mjs depend on this shape):
 *   writeKitHooks(settingsPath) → {
 *     changed: boolean,            // did the file content change?
 *     settingsPath: string,
 *     events: string[],            // kit events written
 *     error?: string,             // present iff the existing file was unparseable
 *   }
 *
 * On a JSON parse error of an existing settings.json, returns
 * {changed:false, error} WITHOUT overwriting — never clobber a file the
 * user may have hand-broken; surface it so they can fix it.
 */
export function writeKitHooks(settingsPath) {
  const events = Object.keys(KIT_HOOKS_BLOCK);

  let settings = {};
  if (existsSync(settingsPath)) {
    try {
      // stripBom: a Windows-editor BOM must not make a valid settings.json read
      // as corrupt and block hook wiring (D-187). Real corruption still errors.
      settings = JSON.parse(stripBom(readFileSync(settingsPath, 'utf8')));
    } catch (err) {
      return {
        changed: false,
        settingsPath,
        events,
        error: `${settingsPath} parse error: ${err?.message ?? err}`,
      };
    }
  }

  const before = JSON.stringify(settings);
  if (!settings.hooks || typeof settings.hooks !== 'object') {
    settings.hooks = {};
  }

  // Walk the UNION of existing events + kit events. For each event, strip
  // any kit-owned entries (matched by KIT_COMMAND_TOKENS), preserving the
  // user's own entries; then re-add the canonical kit entries for events
  // the kit manages. Walking existing events too (not just the 5 kit
  // events) is what PRUNES a stale plugin-form hook the kit no longer
  // emits — e.g. a leftover `Setup → cmk-version-check` written by a
  // pre-0.1.1 `cmk repair --hooks`: it's a kit entry under an event NOT in
  // KIT_HOOKS_BLOCK, so it gets removed rather than left to fail on the
  // npm route (no ${CLAUDE_PLUGIN_ROOT}, no bash).
  const allEvents = new Set([
    ...Object.keys(settings.hooks),
    ...Object.keys(KIT_HOOKS_BLOCK),
  ]);
  for (const eventName of allEvents) {
    const existing = Array.isArray(settings.hooks[eventName])
      ? settings.hooks[eventName]
      : [];
    const isKitEvent = Object.prototype.hasOwnProperty.call(KIT_HOOKS_BLOCK, eventName);
    const hadKitEntry = existing.some(isKitEntry);
    // Leave purely-user events untouched (don't even rewrite an empty
    // array the user authored) — only manage events the kit owns OR that
    // currently carry a stale kit entry to prune.
    if (!isKitEvent && !hadKitEntry) continue;
    const userEntries = existing.filter((e) => !isKitEntry(e));
    // Deep-clone the kit entries before inserting: KIT_HOOKS_BLOCK is only
    // shallow-frozen, so inserting its nested objects by reference would let
    // a later mutation of `settings` leak back into the shared constant.
    const kitEntries = isKitEvent ? structuredClone(KIT_HOOKS_BLOCK[eventName]) : [];
    const next = [...userEntries, ...kitEntries];
    if (next.length > 0) {
      settings.hooks[eventName] = next;
    } else {
      // Event held only kit entries the kit no longer emits (e.g. a stale
      // plugin-form Setup → cmk-version-check): drop the now-empty array
      // instead of leaving `"Setup": []` behind.
      delete settings.hooks[eventName];
    }
  }

  // Task 79 + 90: allow-list the kit's own surfaces so the agent's EXPLICIT
  // captures stay seamless (the AUTO hook path already is). Two prompts to
  // suppress, because Task 69 made the SKILL the capture delivery path:
  //   - `Bash(cmk:*)` (Task 79) — stops "Allow this bash command?" when the
  //     agent runs `cmk remember` / `cmk lessons promote` (prefix-wildcard;
  //     matches any `cmk <subcommand> …`).
  //   - `Skill(memory-write)` (Task 90) — stops "Use skill /memory-write?" when
  //     the model INVOKES the capture skill. The bash rule alone doesn't cover
  //     this: the skill-invocation gate is a separate Claude Code permission
  //     surface (`Skill(<name>)` rule, per code.claude.com/docs/en/permissions).
  //     Surfaced by the v0.2.0 cut-gate live run — the friction Task 79 killed
  //     returned one layer up once capture moved into the skill.
  // Idempotent + over-mutation safe: preserve the user's existing allow entries;
  // only append ours if absent.
  //   - `mcp__cmk__*` (Task 108b, R2 / D-80) — allow-lists the kit's MCP tools
  //     (mk_remember / mk_forget / mk_trust / …) so the model's memory ops run
  //     without a per-call approval prompt. This is the structural fix for the
  //     `cd`-compound bash-permission edge (D-80): the permissions doc confirms
  //     "Combining `cd` with `git` in one compound command always prompts" — and
  //     a `Bash(cmk:*)` rule can't cover a `cd … && cmk …` compound. Running the
  //     SAME memory op as an allow-listed MCP tool sidesteps the bash gate
  //     entirely. `mcp__cmk__*` is the documented server-wildcard form
  //     (code.claude.com/docs/en/permissions — MCP section). Pairs with the
  //     `.mcp.json` server registration written by writeKitMcpServer().
  // Task 133: memory-search joins memory-write — every scaffolded skill needs
  // its own allow entry or the model's invocation trips a "Use skill?" prompt
  // (the Task-90 class; 75.1 scaffolded the skill but missed this).
  // Task 169 (the v0.4.1 cut-gate find, 2026-06-26): Claude Code 2.1.x changed
  // skill-permission matching — the bare `Skill(memory-write)` rule alone no
  // longer suppressed the "Use skill?" prompt; when the user clicked "allow for
  // this project", Claude Code wrote BOTH `Skill(memory-write)` AND
  // `Skill(memory-write:*)` into settings.local.json. So the kit emits BOTH forms
  // (bare for older CC, `:*` for 2.1.x+) — pending a docs re-verification of the
  // current skill-permission syntax.
  // Task 171 (v0.4.1 cut-gate ground-truth, 2026-06-26): the `mcp__cmk__*` server
  // WILDCARD no longer suppresses the per-tool approval prompt on Claude Code
  // 2.1.x — a DIRECT `mk_remember` call (the model using the MCP tool outside the
  // skill's own `allowed-tools`) prompts "Do you want to proceed with
  // mcp__cmk__mk_remember?", and CC writes the SPECIFIC tool name when allowed.
  // (CC 2.1.x churned permission matching heavily — multiple changelog entries
  // closed wildcard auto-approve holes, e.g. 2.1.145 "permission-prompt bypass".)
  // The wildcard worked on older CC; it doesn't now. So allow-list each SPECIFIC
  // cmk MCP tool (the canonical 11 in MCP_AUTO_APPROVE — shared with the Kiro
  // pre-trust) AND keep `mcp__cmk__*` (harmless + future-proof). This is the same
  // upstream-format-tracking the kit does for the Skill rule (D-209) and Kiro.
  const KIT_ALLOW = [
    'Bash(cmk:*)',
    'Skill(memory-write)',
    'Skill(memory-write:*)',
    'Skill(memory-search)',
    'Skill(memory-search:*)',
    'Skill(troubleshooting)',
    'Skill(troubleshooting:*)',
    'mcp__cmk__*',
    ...MCP_AUTO_APPROVE.map((tool) => `mcp__cmk__${tool}`),
  ];
  if (!settings.permissions || typeof settings.permissions !== 'object') {
    settings.permissions = {};
  }
  if (!Array.isArray(settings.permissions.allow)) {
    settings.permissions.allow = [];
  }
  for (const rule of KIT_ALLOW) {
    if (!settings.permissions.allow.includes(rule)) {
      settings.permissions.allow.push(rule);
    }
  }

  // Task 172: pre-approve the kit's OWN project-scoped `.mcp.json` server so its
  // tools connect without the per-project "approve this MCP server?" prompt.
  // `enabledMcpjsonServers` names specific servers to approve (NOT
  // `enableAllProjectMcpServers`, which would blanket-approve EVERY server in
  // `.mcp.json` — too broad for a kit shipped to others; we vouch only for our
  // own server). This clears the SERVER-approval gate; the PermissionRequest
  // hook above clears the per-TOOL gate. Idempotent + preserves any servers the
  // user already approved.
  if (!Array.isArray(settings.enabledMcpjsonServers)) {
    settings.enabledMcpjsonServers = [];
  }
  if (!settings.enabledMcpjsonServers.includes('cmk')) {
    settings.enabledMcpjsonServers.push('cmk');
  }

  const after = JSON.stringify(settings);
  const changed = before !== after;

  if (changed) {
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  }

  return { changed, settingsPath, events };
}

/**
 * Read-merge-write the kit's MCP server registration into
 * `<projectRoot>/.mcp.json` — the project-scoped, committed MCP config
 * (code.claude.com/docs/en/mcp). This makes the kit's memory tools
 * (mk_remember / mk_forget / mk_trust / mk_queue_* / …) available to the model
 * in conversation, so the user never has to run `cmk` themselves (D-85). Pairs
 * with the `mcp__cmk__*` allow rule writeKitHooks() adds (Task 108b, R2 / D-80).
 *
 * The server runs `cmk mcp serve` (PATH-resolved bare bin, matching the hooks);
 * `cmk mcp serve` resolves the project root from CLAUDE_PROJECT_DIR (which Claude
 * Code sets in the spawned server's environment) so it indexes the right project.
 *
 * Idempotent + non-destructive: preserves any OTHER `mcpServers` the user
 * registered; only (re)writes the `cmk` entry. On a JSON parse error of an
 * existing `.mcp.json`, returns `{changed:false, error}` (never clobbers).
 */
export function writeKitMcpServer(projectRoot) {
  const mcpPath = join(projectRoot, '.mcp.json');

  let config = {};
  if (existsSync(mcpPath)) {
    try {
      // stripBom: a BOM'd .mcp.json must not read as corrupt and block MCP
      // registration (D-187). Real corruption still errors.
      config = JSON.parse(stripBom(readFileSync(mcpPath, 'utf8')));
    } catch (err) {
      return { changed: false, path: mcpPath, error: `${mcpPath} parse error: ${err?.message ?? err}` };
    }
  }

  const before = JSON.stringify(config);
  if (!config.mcpServers || typeof config.mcpServers !== 'object') {
    config.mcpServers = {};
  }
  config.mcpServers.cmk = { type: 'stdio', command: 'cmk', args: ['mcp', 'serve'] };
  const after = JSON.stringify(config);
  const changed = before !== after;

  if (changed) {
    mkdirSync(dirname(mcpPath), { recursive: true });
    writeFileSync(mcpPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  }

  return { changed, path: mcpPath };
}
