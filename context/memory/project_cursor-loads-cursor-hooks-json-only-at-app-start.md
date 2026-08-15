---
id: P-4Y3H5F77
type: project
shape: Timeless
title: Cursor Loads `.cursor/hooks.json` Only at App Start
created_at: 2026-07-09T15:39:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 61a22f23eedcc8425f2aeb6dad44757a0e85da0be6f9ab83dae86a2bed8aa6ec
related: [kiro-cmk-setup-checklist-pre-session-1, sessionstart-hook-requires-reopen-after-install, claude-code-hook-activation-requires-restart]
---

Cursor loads hook configuration (`.cursor/hooks.json`) **only when the app starts**, not dynamically during an active session. MCP tools load live by contrast. If you create or modify `.cursor/hooks.json` while Cursor is already running, the active session will have MCP tools but not hooks.

**Detection method:** Check `audit.log` or session transcripts. MCP writes (e.g., `mk_remember` bullets) appearing without hook-fired events (e.g., `afterAgentResponse` fires) indicates hooks.json was not loaded.

**Why:** Explains why the D-262 workaround (fully quit + reopen Cursor) is necessary. Understanding the distinction between live-loaded MCP tools and startup-loaded hooks helps diagnose failures in hook integration tests.

**How to apply:** After placing or modifying `.cursor/hooks.json`, fully quit Cursor (File → Exit, ensure no process lingers in tray) and reopen. On the first turn, check audit logs for hook events to confirm they're active. If only MCP events appear without hook fires, restart Cursor again or verify hooks.json exists and is syntactically correct.
