---
id: P-FK5RXGDE
type: project
title: kiro-cli spawns MCP in cmd.exe wrapper; Claude Code spawns headless
created_at: 2026-06-24T10:28:29Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4526d1918ad1ae1b0584737a9099f9d4fd30e1684a0b6bd51077456d2488b003
related: [claude-code-window-close-leaves-zombie-claude-exe-processes, hc-9-drift-after-claude-code-update-v0-3-4, node-direct-mcp-invocation-workaround-applied-but-unvalidate]
---

- kiro-cli launches MCP via `cmd.exe /C cmk mcp serve` — because cmk is a .cmd/.ps1 shim, a visible shell window opens and persists
- Claude Code spawns MCP as a headless child process (no window)
- The architectural difference between launchers is the root cause; not a code defect

**Why:** Understanding the spawn mechanism directs the fix strategy — it's a launcher integration problem, not an MCP problem

**How to apply:** When debugging kiro-cli-specific MCP issues, first check the spawn mechanism (cmd.exe wrapper vs headless), not just the MCP code itself
