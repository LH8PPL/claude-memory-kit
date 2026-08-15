---
id: P-VUC9TB6X
type: project
title: MCP Server Staleness Workaround
created_at: 2026-06-16T11:18:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0aa490fce18a8b4317073875983cdd5c705dd7d99b42c1d6e56aee2f3e72e5e1
related: [mcp-server-may-retain-stale-code-in-memory-after-package-upd, mcp-server-staleness-gotcha-d-80, mcp-server-state-isolation-in-testing]
---

When Claude Code's MCP server becomes stale (serving pre-fix code), restart the tool with `/exit` followed by `claude`. This closes the stale MCP server and reconnects, reloading updated code without a full session restart.

**Why:** MCP servers can drift out of sync mid-session, causing queries to fail against pre-fix code even though the fix is deployed. Quick restart avoids confusion when debugging apparent regressions.

**How to apply:** If a query works in CLI but fails in the MCP tool, check whether the MCP server is stale and restart with `/exit` then `claude`.
