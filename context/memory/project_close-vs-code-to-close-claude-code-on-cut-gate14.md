---
id: P-X2VUTU3Z
type: project
title: Close VS Code to close Claude Code on cut-gate14
created_at: 2026-06-16T12:00:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fc05ada6030d0facb1fa913746cc4b25cbca16d3e97aac9203a0634223b3e7f7
related: [hook-binary-spawned-fresh-each-turn, windows-terminal-path-refresh-after-visual-studio-build-tool, mcp-server-may-retain-stale-code-in-memory-after-package-upd]
---

On cut-gate14, Claude Code cannot be closed independently. Closing the VS Code window is the only way to close Claude Code.

**Why:** Environment-specific constraint relevant to session lifecycle and testing procedures.

**How to apply:** To close Claude Code on cut-gate14, close the entire VS Code window.
