---
id: P-9CRAJDZN
type: project
shape: State
title: MCP Connection Logs Location in Claude Code
created_at: 2026-07-06T14:04:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dc91053a38ab2aa7618ccbd259832de8a9fdb1d7e3fbb31212cc6901ea3c7d87
related: [global-cli-rebuild-and-reinstall-workflow, claude-code-deferred-tools-first-turn-race-condition, kiro-cli-integration-test-gate-and-reinstall]
---

- Path: `AppData/Local/claude-cli-nodejs/Cache/c--Temp-cut-gate21/mcp-logs-cmk/`
- Shows per-session: connection time, transport type, tools advertised, version
- Format example: "Successfully connected (transport: stdio) in 925ms ... hasTools:true"

**Why:** Needed to distinguish MCP server health from API-layer ToolSearch failures; logs are authoritative ground truth

**How to apply:** For future Claude Code/MCP integration issues, consult these logs to verify server connection success before treating it as an API bug
