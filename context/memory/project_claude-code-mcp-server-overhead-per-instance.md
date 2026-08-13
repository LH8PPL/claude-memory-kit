---
id: P-CGHPXEFV
type: project
shape: Timeless
title: Claude Code MCP Server Overhead Per Instance
created_at: 2026-07-27T19:05:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2a34a052cb0af7ce74f7c4ac60fb5f19ece33fdbaf481378c91c1a4e102b0d5f
related: [vs-code-windows-are-independent-claude-code-sessions, claude-code-window-close-leaves-zombie-claude-exe-processes, windows-dll-locking-during-cmk-reinstall]
---

Each Claude Code window spawns its own independent MCP server stack (fetch server with uv + Python, AWS knowledge proxy, memory server, kit's cmk mcp serve). This adds ~400 MB per instance; two concurrent windows means ~800 MB total duplicated overhead.

**Why:** Explains high memory usage when running multiple Claude Code windows; informs decisions about instance count vs. resource constraints.

**How to apply:** When optimizing memory or choosing instance count, remember each window carries a full MCP stack. Closing unused instances reclaims ~400–600 MB per window.
