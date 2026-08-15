---
id: P-QJLBaF99
type: project
title: Memory Routes by Execution Surface
created_at: 2026-06-24T18:05:16Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d8e92208e6af63aec60980ab55e44ba896152c8593030f1f11ae1ff7024d9120
related: [kiro-cli-explicit-save-limitation-known, kiro-cli-does-not-pass-mcp-environment-variables, disable-mcp-in-ide-wrappers-with-includemcpjson-false]
---

Three distinct memory paths exist:
- **Claude Code** → MCP tools (`mk_remember`) — fully working
- **Kiro IDE** → MCP tools — fully working
- **kiro-cli** → Hooks (automatic) + CLI (`cmk search`, `cmk remember`) — automatic works; explicit saves flaky

**Why:** Execution contexts differ in capabilities. kiro-cli cannot reliably use MCP but captures memory via shell hooks.

**How to apply:** Route memory operations by surface. Document kiro-cli gaps. Rely on automatic hook capture for kiro-cli; explicit CLI is a known limitation.
