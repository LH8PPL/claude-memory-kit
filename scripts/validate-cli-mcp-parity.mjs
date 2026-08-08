#!/usr/bin/env node
// Structural parity guard (Task 108b / ADR-0014).
//
// SCOPE (honest, per D-102): this checks **structural existence only** — that
// every memory OPERATION exists on BOTH surfaces. It does NOT check behavioral
// or message parity (it cannot see that, e.g., a tier-deferral message drifted
// into three divergent copies — that was the Task 121 fix). BEHAVIORAL parity
// is enforced differently: both surfaces are thin adapters over ONE shared core
// (`remember-core.mjs` / `read-core.mjs`) + shared constants (e.g.
// `nonProjectTierNote`), so they can't diverge in behavior without diverging the
// core. This guard catches the OTHER drift class: a tool/verb going missing.
//
// Every memory OPERATION must exist on BOTH surfaces — the CLI (`cmk …`, the
// substrate Claude drives) and the MCP tools (what the model calls in
// conversation per D-85). This guard fails the build when the two drift:
//
//   - a parity op is missing its CLI verb or its MCP tool;
//   - an MCP tool exists with no CLI counterpart (orphan);
//   - a CLI verb is neither a parity op nor an explicitly-declared infra-only
//     command (forces a conscious decision whenever a new verb is added).
//
// Inputs: the CLI subcommand registry (imported — it's plain data) + the MCP
// tool registrations (regex-parsed from source, so no index DB is needed).

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');

// The canonical correspondence: a shared memory op ↔ its CLI verb ↔ its MCP
// tool(s). Adding a new shared op means adding a row here + both implementations.
export const PARITY_MAP = {
  remember: { cli: 'remember', mcp: ['mk_remember'] },
  search: { cli: 'search', mcp: ['mk_search'] },
  get: { cli: 'get', mcp: ['mk_get'] },
  timeline: { cli: 'timeline', mcp: ['mk_timeline'] },
  expand: { cli: 'expand', mcp: ['mk_expand'] },
  links: { cli: 'links', mcp: ['mk_links'] },
  cite: { cli: 'cite', mcp: ['mk_cite'] },
  'recent-activity': { cli: 'recent-activity', mcp: ['mk_recent_activity'] },
  trust: { cli: 'trust', mcp: ['mk_trust'] },
  forget: { cli: 'forget', mcp: ['mk_forget'] },
  // `cmk lessons promote` (a parent verb with a `promote` child) ↔ mk_lessons_promote.
  'lessons promote': { cli: 'lessons', mcp: ['mk_lessons_promote'] },
  // `cmk queue review|conflicts` (interactive walkers) ↔ list + resolve tools.
  queue: { cli: 'queue', mcp: ['mk_queue_list', 'mk_queue_resolve'] },
};

// CLI verbs that are deliberately CLI-ONLY — installation, lifecycle, health,
// and maintenance commands the model has no reason to drive (it doesn't install
// the kit, run health checks, or register cron jobs). Each is a conscious "no
// MCP surface" decision; adding a new CLI verb forces a choice between this set
// and PARITY_MAP (an unclassified verb fails the guard).
export const CLI_ONLY = new Set([
  'install', 'uninstall', 'init-user-tier', 'reindex', 'doctor', 'config', 'digest',
  'import-anthropic-memory', 'import-claude-md', 'transcripts', 'purge', 'roll', 'repair',
  // `import-sessions` is a bulk user-invoked bootstrap (interactive picker +
  // cost consent) — the USER onboarding their history, not the model operating
  // memory mid-session; same CLI-only class as the other import verbs (Task 225).
  'import-sessions',
  // `tour` is a human-facing onboarding explainer (like doctor/stats) — the
  // in-conversation surface is the /tour slash command running the CLI, not
  // an MCP tool (Task 175).
  'tour',
  // `backfill` is infra/lifecycle: the daily cron does it automatically (D-169)
  // and the verb is only a manual maintenance override — not an operation the
  // model should drive mid-conversation (Task 174).
  'backfill',
  // `autolink` is maintenance over the EXISTING corpus (Task 262): the write
  // path links new facts automatically with no command at all, and this verb is
  // the one-off catch-up pass for what was written before the mechanism
  // existed. Same class as `backfill`/`reindex` — the user runs it once, the
  // model has no reason to drive it mid-conversation.
  'autolink',
  'daily-distill', 'weekly-curate', 'persona', 'disable-native-memory',
  'enable-native-memory', 'compress', 'register-crons', 'mcp', 'version',
  // `hook` is the Kiro hook entrypoint (called by Kiro's IDE/CLI hooks, never by
  // the model via MCP) — infra/lifecycle, like the other hook bins (Task 50).
  'hook',
  // `cursor-hook` is the Cursor hook entrypoint (called by .cursor/hooks.json,
  // never by the model via MCP) — same infra/lifecycle class (Task 196).
  'cursor-hook',
  // `codex-hook` is the Codex hook entrypoint (called by .codex/hooks.json,
  // never by the model via MCP) — same infra/lifecycle class (Task 196 tail).
  'codex-hook',
  // `stats` is a human-facing behavioral report (Task 212, report-only) —
  // like doctor/config, it's the USER inspecting the kit, not the model
  // operating memory. If an agent ever needs the numbers (e.g. Task 194
  // auto-tuning), that's a deliberate future MCP addition, not drift.
  'stats',
  // `view` is the human-facing read-only viewer (Task 255) — a browser UI for a
  // PERSON to browse their memory, in the same class as doctor/stats/tour. The
  // model already has every one of the viewer's reads as an MCP tool
  // (mk_search / mk_get / mk_links / mk_recent_activity); an `mk_view` would
  // hand it a URL it cannot open. CLI-only by contract, not by omission.
  'view',
  // `redact` is the compliance scrub (Task 96, ADR-0022) — CLI-only BY
  // CONTRACT, not by omission: the destructive/compliance path stays
  // explicit-human (§6.5). `purge` (already listed above) is its
  // irreversible sibling. Adding either as an MCP tool is a §6.5 violation,
  // not parity drift — cli-redact.test.js pins the absence.
  'redact',
]);

/**
 * Pure parity check. Returns an array of human-readable drift errors (empty =
 * in parity). Separated from IO so it's unit-testable with synthetic inputs.
 *
 * @param {object} a
 * @param {Set<string>} a.cliVerbs   - registered CLI subcommand names.
 * @param {Set<string>} a.mcpTools   - registered MCP tool names.
 * @param {object}      [a.parityMap]
 * @param {Set<string>} [a.cliOnly]
 */
export function checkParity({ cliVerbs, mcpTools, parityMap = PARITY_MAP, cliOnly = CLI_ONLY }) {
  const errors = [];
  const mappedMcp = new Set();
  const mappedCli = new Set();

  // 1. Every parity row has BOTH sides present.
  for (const [op, { cli, mcp }] of Object.entries(parityMap)) {
    mappedCli.add(cli);
    if (!cliVerbs.has(cli)) {
      errors.push(`parity op '${op}': CLI verb '${cli}' is not registered in subcommands.mjs`);
    }
    for (const tool of mcp) {
      mappedMcp.add(tool);
      if (!mcpTools.has(tool)) {
        errors.push(`parity op '${op}': MCP tool '${tool}' is not registered in mcp-server.mjs`);
      }
    }
  }

  // 2. No orphan MCP tool — every registered tool maps to a CLI op.
  for (const tool of mcpTools) {
    if (!mappedMcp.has(tool)) {
      errors.push(
        `MCP tool '${tool}' has no CLI parity entry — add it to PARITY_MAP (with its CLI verb), or justify a deliberate MCP-only exception here`,
      );
    }
  }

  // 3. Every CLI verb is classified — parity OR infra-only. Forces a decision on
  //    every new verb so a memory op can't ship CLI-only by accident.
  for (const verb of cliVerbs) {
    if (!mappedCli.has(verb) && !cliOnly.has(verb)) {
      errors.push(
        `CLI verb '${verb}' is unclassified — add it to PARITY_MAP (with an MCP tool) if the model should be able to do it, or to CLI_ONLY if it is infra/lifecycle`,
      );
    }
  }

  return errors;
}

/** Parse the registered MCP tool names from mcp-server.mjs source. */
export function parseMcpTools(src) {
  return new Set([...src.matchAll(/registerTool\(\s*['"]([a-z_]+)['"]/g)].map((m) => m[1]));
}

/**
 * Every MCP tool must be in the Kiro `autoApprove` list (D-196), both
 * directions — so a NEW tool can't silently ship un-auto-approved (it would
 * prompt Reject/Trust/Run in a Kiro chat, re-introducing the bug for that one
 * tool), and a removed tool can't leave a stale autoApprove entry. (skill-review
 * I1 — the explicit-list drift guard.)
 */
export function checkAutoApprove({ mcpTools, autoApprove }) {
  const errors = [];
  const approved = new Set(autoApprove);
  for (const t of mcpTools) {
    if (!approved.has(t)) {
      errors.push(`MCP tool '${t}' is registered but NOT in MCP_AUTO_APPROVE (install-kiro.mjs) — it would prompt Reject/Trust/Run in Kiro (D-196)`);
    }
  }
  for (const t of approved) {
    if (!mcpTools.has(t)) {
      errors.push(`MCP_AUTO_APPROVE lists '${t}' but no such MCP tool is registered (stale entry) — remove it from install-kiro.mjs`);
    }
  }
  return errors;
}

async function runCli() {
  const { subcommands } = await import('../packages/cli/src/subcommands.mjs');
  const { MCP_AUTO_APPROVE } = await import('../packages/cli/src/install-kiro.mjs');
  const cliVerbs = new Set(subcommands.map((s) => s.name));
  const mcpTools = parseMcpTools(
    readFileSync(join(REPO, 'packages/cli/src/mcp-server.mjs'), 'utf8'),
  );
  const errors = [
    ...checkParity({ cliVerbs, mcpTools }),
    ...checkAutoApprove({ mcpTools, autoApprove: MCP_AUTO_APPROVE }),
  ];
  if (errors.length > 0) {
    console.error('validate-cli-mcp-parity: FAIL');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  console.log(
    `validate-cli-mcp-parity: OK — ${Object.keys(PARITY_MAP).length} parity ops, ${mcpTools.size} MCP tools (all auto-approved for Kiro), ${cliVerbs.size} CLI verbs (all classified)`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  runCli();
}
