---
id: P-DMEQPJEB
type: project
shape: Timeless
title: Claude Code Deferred-Tools First-Turn Race Condition
created_at: 2026-07-06T14:04:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3450b1a6422c072ccd61b61d720d861b82f7ef0845eaabaa445bf21d41d091c9
related: [claude-code-mcp-deferred-tool-race-issue-42148, kiro-cli-custom-agent-tool-limitation, cli-fallback-for-mcp-tool-resolution-failures]
---

- Claude Code v2.1.x freezes deferred-tool list at turn-start, before MCP servers finish connecting (10-30s typical)
- Symptom: ToolSearch fails on first turn despite healthy MCP connection and hasTools:true advertised
- Root cause: Claude Code API-side hydration layer, not server bug
- Workaround: retry on fresh turn or use CLI fallback (kit's fallback mechanism mitigates this)

**Why:** Not fixable server-side (no protocol mechanism to opt out of deferral). Known issue: Claude Code #42148 / #60052. Understanding the race explains why first-turn failures don't indicate broken code.

**How to apply:** Document in gate guide that first-turn ToolSearch misses are expected on cold start; retry resolves it. Not a gate blocker.
