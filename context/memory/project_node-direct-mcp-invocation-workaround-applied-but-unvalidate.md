---
id: P-44DQF4BX
type: project
title: node-direct MCP invocation workaround — applied but unvalidated in kiro-cli UI
created_at: 2026-06-24T10:28:29Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ed04b22aabe74a05ed7c51247d16af841e9f7b19c091f86067f515b9970f77d8
related: [kiro-cli-mcp-registration-configuration-gap, kiro-cli-spawns-mcp-in-cmd-exe-wrapper-claude-code-spawns-he, kiro-cli-project-workaround-for-project-path-passing]
---

- **Attempted fix:** change mcp.json from `command: 'cmk'` to `command: 'node'` + absolute path to cmk.mjs
- **Rationale:** node.exe is a real binary (not a shim), so even when kiro-cli wraps it, the shell window is bypassed
- **What's done:** applied to C:\Temp\kiro-cli-gate mcp.json; confirmed MCP server starts in isolation
- **What's not done:** window still appears on user's latest test — fix not yet validated in kiro-cli UI
- **Caveat:** hardcoded node path + absolute path is less portable than `cmk` command; if successful, installer should compute the path at install time

**Why:** Attempting to eliminate the cmd.exe window on startup without modifying kiro-cli's launcher

**How to apply:** Next step is user validation in kiro-cli UI (is window gone?); if it fails, fallback is a hidden-window stub shim; if it succeeds, bake the path computation into the installer
