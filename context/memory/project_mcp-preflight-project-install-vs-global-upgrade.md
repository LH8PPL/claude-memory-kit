---
id: P-M4XEX543
type: project
shape: Timeless
title: MCP Preflight — Project Install vs Global Upgrade
created_at: 2026-07-12T11:55:55Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 64cd7d2325ba6fb8e73d662e815f4edfaf48d7885751c6db17dd88e221c64b4d
related: [task-205-preflight-fires-on-wrong-trigger-design-flaw, npm-uninstall-ebusy-error-with-better-sqlite3-node-on-rebuil, windows-dll-lock-blocks-npm-reinstall]
---

The `cmk install` command includes a preflight check (Task 205) that detects running MCP server processes via PID scan and reports command lines.

**When it prompts**: If MCP servers detected (e.g., "pid 30444 — node ... cmk.m…"  
**Prompt text**: "Stop them now? They reconnect automatically next tool call. [y/N]"

**For project installs**: Answer **N**. A `cmk install` into a project directory does not touch `node_modules` globally, so the lock hazard (guarding `npm install -g` against corrupting open DLLs) does not apply.

**Result of N**: Install proceeds uninterrupted; MCP connections remain open; if servers were stopped externally, they reconnect on next tool call.

**Why:** The prompt is generic and warns about global upgrades, but during routine project scaffolding, the hazard does not exist. Answering N avoids false alarms and keeps Claude Code sessions running.

**How to apply:** When `cmk install` prompts about MCP servers during project setup, answer N and proceed. No recovery action needed.
