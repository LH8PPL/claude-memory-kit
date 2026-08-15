---
id: P-F7XQXFKL
type: project
title: VS Code Windows Are Independent Claude Code Sessions
created_at: 2026-06-16T12:01:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9a88f14cef00ea8a6abf06fa77583c88bfac6a190c2b02da8a5080ba67f93fe9
related: [claude-code-mcp-server-overhead-per-instance, hook-binary-spawned-fresh-each-turn, mcp-activation-restart-behavior]
---

Each VS Code window runs its own independent process with:
- Separate Claude Code session (own conversation history)
- Separate MCP server instance (cmk mcp serve)
- Independent random auth token per activation
- Server bound to 127.0.0.1 on random high port
- Closing/restarting one window does NOT affect other windows

**Why:** Critical for parallel work and troubleshooting; prevents confusion about session/server state; allows independent problem-solving in different windows without risk to other conversations

**How to apply:** Treat each VS Code window as completely isolated; restarting one window (for server refresh, rebuild, etc.) does not impact other Claude Code conversations or windows
