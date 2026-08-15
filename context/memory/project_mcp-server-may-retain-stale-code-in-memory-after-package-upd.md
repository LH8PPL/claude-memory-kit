---
id: P-FKVJZZQL
type: project
title: MCP server may retain stale code in memory after package updates
created_at: 2026-06-16T12:00:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 62c1c955410fa56fde077f63447afc0c1969f9823297358338e4e3773e2a1edf
related: [kiro-requires-full-restart-to-load-updated-hooks, close-claude-code-before-global-cmk-install-to-avoid-ebusy, mcp-serve-is-long-lived-restart-after-rebuild-or-you-test-st]
---

Claude Code's MCP server process may not load fresh package code until restart. CLI tools (`cmk search`, `cmk digest`) always use fresh code. Test the running server with `mk_search <query>` — success indicates fresh code; failure indicates staleness.

**Why:** Session 2 recall tests use `mk_search` (MCP server). Stale server can error even if fixes are on disk.

**How to apply:** Before Session 2, run `mk_search <query>` to test the running server. If it succeeds, server is current; if it fails, close and reopen VS Code. CLI tools work regardless.
