---
id: P-H4KU6775
type: project
title: 'Disable MCP in IDE Wrappers With includeMcpJson: false'
created_at: 2026-06-24T18:10:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6a981fc32dee6d8e72f82cd76240506975fae8d43313d52ef5a79edb808e8c8d
related: [memory-routes-by-execution-surface, pr-organization-separate-ide-pr-1-and-cli-pr-2-surfaces, kiro-cli-mcp-configuration-disable-to-kill-popup]
---

- Setting `includeMcpJson: false` in the IDE configuration (e.g., kiro-cli) prevents MCP server initialization and eliminates the cmd.exe popup on Windows
- Trade-off: also disables MCP-based automatic memory capture
- Workaround: memory capture falls back to `cmk remember` command (explicit) or automatic session-end hook capture (implicit)

**Why:** Some IDEs don't support MCP or users want a minimal footprint; the fix improves UX. Memory capture still works via hooks.

**How to apply:** When configuring IDE wrappers for environments without MCP, set `includeMcpJson: false` in the config. Ensure session-end hook or cmk-remember integration is in place for memory persistence.
