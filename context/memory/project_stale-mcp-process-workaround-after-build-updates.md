---
id: P-MaWYNV6F
type: project
title: Stale MCP Process Workaround After Build Updates
created_at: 2026-06-18T05:12:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 401cc085197d37472a8223e991d7b29aff28c23769c474fabf8d81e8bd734452
related: [kiro-requires-full-restart-to-load-updated-hooks, mcp-server-staleness-gotcha-d-80, claude-code-hook-activation-requires-restart]
---

MCP server processes spawned at session start do not auto-update when the binary changes. A session from before an MCP build update will serve stale code to Claude until killed.

**Why:** The processes are long-lived and bound to the binary they loaded with; new sessions spawn fresh processes, but old sessions continue serving the outdated version

**How to apply:** After a major MCP/Claude Code build update, restart Claude Code or kill orphaned MCP processes (e.g., PIDs reported in earlier sessions) to ensure the next session binds to the new build
