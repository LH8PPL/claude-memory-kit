---
id: P-L5WHXB9H
type: project
title: CC 2.1.x mcp__server__* wildcard does not auto-approve MCP tools — need specific tool names
created_at: 2026-06-26T20:45:03Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 503008aabd99c9ff06003f15c15e8feaa1ec02a74cf005a6d5640ab6d1cc5846
related: [claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil, open-cmk-mcp-per-tool-prompt-systematic-investigation-pendin, cc-update-does-not-fix-mcp-prompt-task-171-validated]
---

v0.4.1 cut-gate ground-truth (cut-gate-v041d, live test): the kit's prompt-free promise breaks on Claude Code 2.1.x because of the MCP-tool gate, NOT the skill gate. PROVEN by watching what CC writes when the user clicks 'allow (shared)': (1) Skill gate — kit writes Skill(memory-write)+Skill(memory-write:*); CC writes the IDENTICAL forms to settings.json; after one allow the skill runs prompt-free. So the kit's Skill allow-list is CORRECT. (2) MCP gate — kit writes the WILDCARD mcp__cmk__* but CC still prompts 'Do you want to proceed with mcp__cmk__mk_remember?' and, on allow, writes the SPECIFIC tool name mcp__cmk__mk_remember (not the wildcard). So mcp__cmk__* does NOT auto-approve individual MCP tool calls on 2.1.x — CC needs the specific per-tool names. The skill's own allowed-tools frontmatter covers the through-skill path, but a DIRECT mk_remember call (Claude saying 'the tool is loaded, I'll save directly') hits the bare MCP gate and prompts. FIX: the kit must allow-list each specific cmk MCP tool (mcp__cmk__mk_remember, mcp__cmk__mk_search, ... all 11), not just mcp__cmk__*. Also: settings.json IS honored for both skill + mcp permissions (CC's 'allow shared' writes there); the earlier 'only settings.local.json works' theory was WRONG.

**Why:** The whole prompt-free promise broke at the v0.4.1 gate. We chased the Skill() form (Task 169) but the live ground-truth test proved the Skill allow-list was already correct — the real gap is the MCP wildcard mcp__cmk__* not suppressing per-tool prompts on CC 2.1.x. Caught only by watching what CC itself writes (the read-what-the-tool-wrote technique), not by docs (which claim the wildcard works).

**How to apply:** In settings-hooks.mjs KIT_ALLOW: keep mcp__cmk__* (harmless/future) but ADD each specific cmk MCP tool name (mcp__cmk__mk_remember, mk_search, mk_get, mk_forget, mk_trust, mk_timeline, mk_cite, mk_recent_activity, mk_lessons_promote, mk_queue_list, mk_queue_resolve). Get the canonical 11 from mcp-server.mjs. Verify against MCP_AUTO_APPROVE (kiro-constants.mjs) which already lists them for Kiro. Re-test live: a DIRECT mk_remember call should be prompt-free after a fresh install.
