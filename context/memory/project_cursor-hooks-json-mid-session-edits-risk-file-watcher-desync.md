---
id: P-JVDNQPQD
type: project
shape: Timeless
title: Cursor hooks.json Mid-Session Edits Risk File Watcher Desync
created_at: 2026-07-09T17:40:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cc45f730e2c44a9f228c523a482ca2ec4e85cf015ac1cb6fb6c6bf56ef3f571a
related: [claude-code-hook-activation-requires-restart, cursor-loads-cursor-hooks-json-only-at-app-start, sessionstart-hook-requires-reopen-after-install]
---

Editing `hooks.json` while Cursor is running can cause its file watcher to desync, potentially causing the new configuration to not be picked up reliably.

**Why:** Known Cursor limitation affecting hook configuration changes during active sessions.

**How to apply:** Prefer restarting Cursor after modifying `hooks.json`, or avoid mid-session edits to hooks.json specifically.
