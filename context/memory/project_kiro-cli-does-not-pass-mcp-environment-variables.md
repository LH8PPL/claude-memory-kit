---
id: P-67N3M6LT
type: project
title: kiro-cli Does Not Pass MCP Environment Variables
created_at: 2026-06-24T15:10:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 11e5682e714d0d9462ee1c08fe7997584f98ecb29a682005182e1a8b1cdf0a8e
related: [memory-routes-by-execution-surface, kiro-cli-mcp-server-env-passing-limitation, kiro-cli-explicit-save-limitation-known]
---

- **Issue**: kiro-cli spawns the MCP server but does NOT pass `mcp.json` `env` variables to the spawned process
- **Effect**: `CMK_PROJECT_DIR` is never set in the MCP server, causing `mk_remember` to fail silently (agent reports "saved" but nothing persists)
- **Confirmed**: Testing in gate2 with a fresh MCP server showed writes landed nowhere

**Why:** Breaks reliable memory capture via kiro-cli; confirmed by direct testing

**How to apply:** Document as a known kiro-cli limitation. Investigate workarounds (kiro launch from project cwd, alternative env-pass mechanism, upstream fix) or advise against relying on kiro-cli for memory captures until resolved.
