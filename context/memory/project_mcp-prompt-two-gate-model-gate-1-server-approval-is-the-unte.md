---
id: P-B5XGGC3M
type: project
title: MCP prompt = two-gate model; Gate 1 (server approval) is the untested fix
created_at: 2026-06-27T13:54:14Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 91c82318e7ab346cae0f23365601746ad70abd785483b46117c0914c93491b8e
related: [solved-enableallprojectmcpservers-true-prompt-free-mcp-captu, open-cmk-mcp-per-tool-prompt-systematic-investigation-pendin, tension-skill-allowed-tools-pre-grants-mcp-tools-removing-it]
---

EVIDENCE TABLE (from Anthropic primary docs, 2026-06-27) — the cmk MCP prompt is a TWO-GATE model, gates are independent: GATE 1 = project .mcp.json SERVER approval ("the first time CC sees a project-scoped server it asks you to approve it, so a cloned repo can't launch processes without consent"; cleared by settings field enableAllProjectMcpServers:true OR enabledMcpjsonServers:["cmk"], OR clicking approve; pending servers show "⏸ Pending approval" in `claude mcp list`). GATE 2 = per-TOOL permission (default mode "prompts for permission on first use of each tool"; cleared by a permissions.allow rule — and mcp__cmk__* IS valid syntax per the permissions doc: "mcp__server__* matches all tools from that server"). KIT STATUS: writes mcp__cmk__* + 11 names (Gate 2, correct syntax) but does NOT write enableAllProjectMcpServers/enabledMcpjsonServers (Gate 1 — UNCLEARED). HYPOTHESIS (one, grounded): Gate 1 is the real blocker — the cmk server stays "⏸ Pending approval" because the kit never writes the server-approval field, so CC surfaces it as a per-tool approval prompt every session and the (correct) allow-list is never reached. SETTINGS NOTE: enableAllProjectMcpServers/enabledMcpjsonServers may be settings.json-only (not settings.local.json) per the settings doc's scope table. PRECEDENCE (verified): managed > CLI > local settings.local.json > project settings.json > user. SINGLE TEST TO RUN (post-restart, fresh folder, NOT v041f): add enableAllProjectMcpServers:true to settings.json, confirm `claude mcp list` shows cmk ✓ Connected (not ⏸ Pending) BEFORE testing capture; if capture is then prompt-free, Gate 1 was it and the kit-fix is to write that field at install.

**Why:** Re-reading all five CC docs end-to-end (the user's request) revealed the prompt is a two-independent-gate model. The kit clears Gate 2 (tool allow-list) correctly but never clears Gate 1 (server approval) — which is the likely real cause, and is cleared by a settings field the kit does not currently write.

**How to apply:** Post-restart, on a FRESH folder: write enableAllProjectMcpServers:true (or enabledMcpjsonServers:["cmk"]) into .claude/settings.json, verify `claude mcp list` shows cmk ✓ Connected not ⏸ Pending, THEN test capture. If prompt-free, codify as the install fix (write the field in settings-hooks.mjs). Confirm which settings file CC actually honors the field from by observation.
