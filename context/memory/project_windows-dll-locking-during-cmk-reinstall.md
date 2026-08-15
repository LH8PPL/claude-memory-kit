---
id: P-4UGWAaVB
type: project
shape: State
title: Windows DLL Locking During cmk Reinstall
created_at: 2026-07-08T17:01:56Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2fcdc41213be8eb7daef9db3f7004fb5a10371acfbf36f1f50333fa2d182bcc9
related: [close-claude-code-before-global-cmk-install-to-avoid-ebusy, windows-ebusy-when-updating-cmk-during-claude-code-runtime, windows-sqlite-dll-lock-from-running-mcp-server]
---

The claude-memory-kit's MCP server (`cmk mcp serve`) locks SQLite DLLs on Windows, breaking reinstalls if the server is running. Current workaround: kill the server procs before reinstalling. Details: Task 205 / Decision D-302 (memory P-aLLW62HD). Priority: v0.5.1, not v0.5.0 blocker. Fix approach: detect/stop own server, retry-on-EBUSY, or preserve old global + recovery guidance.

**Why:** Known bug affecting Windows workflow. Not a tag blocker but needs proper fix in v0.5.1. Future sessions need the workaround, tracking info, and awareness that this is a temporary patch, not normal procedure.

**How to apply:** Before Windows reinstalls, kill any running `cmk mcp serve` procs. Check Task 205/D-302 when v0.5.1 work starts. Remember this is a workaround, not the real fix.
