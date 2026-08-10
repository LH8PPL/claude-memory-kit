---
id: P-DW4Y4DLS
type: project
title: Claude Code 2.1.x MCP Wildcard Auto-Approve Change
created_at: 2026-06-27T07:07:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c72ce23b09c28e63de06b750f0fcce26c9da4cdfc6a3f151b17421be3694daeb
related: [global-mcp-tool-prompts-suppressed-via-settings-allow-list, cc-update-does-not-fix-mcp-prompt-task-171-validated, cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools]
---

CC 2.1.x closed security holes in wildcard auto-approval for MCP tools. Rules like `mcp__cmk__*` no longer auto-approve per-tool prompts; each tool must be explicitly allowed in `settings.json`.

**Why:** CC's upstream security tightening; explains the v0.4.1 regression and why Bug 171 happened

**How to apply:** When testing CMK on CC 2.1.x+, expect individual per-tool prompts unless they are explicitly whitelisted. The kit's settings.json generation must list all 11 tools individually (which v0.4.1 now does).
