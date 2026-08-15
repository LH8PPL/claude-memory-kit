---
id: P-2MTSMLPQ
type: project
shape: Timeless
title: Context Snapshot Frozen at Session Start
created_at: 2026-07-03T11:16:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 67591851bf29ac1464ed40925df556af67143e94ba8d412dd1b1baa6102f94c7
related: [claude-memory-kit-installation-levels, sessionstart-hook-requires-reopen-after-install, kiro-requires-full-restart-to-load-updated-hooks]
---

Session context is loaded at session initialization and remains frozen for all subsequent turns within that session. Turns do NOT reload context from the filesystem. To load fresh context, a new session must be started.

**Why:** Critical for validation workflows; stale context in an ongoing session skews context-sensitive tests like B3/B4 wedge. Required for honest testing of cross-project doctrine capture.

**How to apply:** When running validation workflows dependent on fresh context state, start a new session rather than reusing an existing window
