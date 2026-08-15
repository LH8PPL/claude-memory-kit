---
id: P-PV532NCU
type: project
title: 'SOLVED: enableAllProjectMcpServers:true = prompt-free MCP capture'
created_at: 2026-06-27T14:00:11Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: b339df23fd1f60633054b0a9b4627a630ae6ac85a9e197b1586207466c8d004d
related: [confirmed-enabledmcpjsonservers-cmk-narrow-form-prompt-free, mcp-prompt-two-gate-model-gate-1-server-approval-is-the-unte, cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools]
---

SOLVED + LIVE-PROVEN (cut-gate-v041g, 2026-06-27): enableAllProjectMcpServers:true in the COMMITTED .claude/settings.json makes cmk MCP capture PROMPT-FREE. Controlled single-variable test: fresh install (project .mcp.json cmk server, no enableAllProjectMcpServers, no settings.local.json) → added ONLY enableAllProjectMcpServers:true to settings.json → opened in CC → stated a preference → the memory-write skill ran → mk_remember executed and SAVED SILENTLY with NO "proceed with mcp__cmk__..." prompt (user: "didnt ask anything"; output showed id P-NLPQPKaU written_to feedback_run-flake8...). This CONFIRMS the two-gate model: the blocker was GATE 1 (project .mcp.json SERVER approval — the server was stuck ⏸ Pending, so CC surfaced it as a per-tool prompt every session); enableAllProjectMcpServers:true pre-approves the server → the (already-correct) mcp__cmk__* allow-list then takes over. Works from COMMITTED settings.json (no settings.local.json needed). RETROACTIVELY EXPLAINS: Task 171 (specific tool names) failed because it cleared Gate 2 not Gate 1; the earlier enabledMcpjsonServers attempt didn't take. THE KIT FIX: writeKitHooks (settings-hooks.mjs) must write enableAllProjectMcpServers:true into the scaffolded .claude/settings.json at install + repair --hooks, idempotently. File as the real Task for the prompt-free promise.

**Why:** This is the answer to the whole-session-long prompt-free regression. Live-proven via a controlled single-variable test on a fresh folder — the kit's core promise (automatic, prompt-free capture) depends on it, and it must be the documented fix going forward, superseding the disproven Task 171 theory.

**How to apply:** Kit fix: settings-hooks.mjs writeKitHooks writes enableAllProjectMcpServers:true into .claude/settings.json (committed tier) idempotently at install + repair --hooks. Add a test asserting the field is present. Then re-verify on a fresh folder. Note the one-time Skill(memory-write) approval is a SEPARATE layer (already allow-listed; handled). Consider whether to keep Task 171's allow-list (harmless belt-and-suspenders) or note it as superseded.
