---
id: P-WX5WPTTJ
type: project
title: cmk-compress-session requires SessionEnd hook invocation; manual terminal runs hang
created_at: 2026-06-18T12:51:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 575c796f8d77fe2ea8e6c9d145624012ff7e25f2f0ddeab271025b649fa6995d
related: [cmk-tool-invocation-cmk-compress-session-vs-cmk-compress-laz, minor-release-triggers-backlog-sweep, use-mcp-mk-remember-not-bash-cli]
---

`cmk-compress-session` is the SessionEnd hook handler (registered in `.claude/settings.json`). It's designed for automatic invocation by Claude Code with a piped hook payload, not for manual terminal use.

Manual invocation causes hangs because the tool expects stdin piped from the hook system. The code has TTY detection (line 50, `readHookStdin` comment) designed to handle this case, but manual invocation still results in hangs—likely from stdin/TTY handling or the model spawn step.

For testing:
- Session-end behavior → use real Claude Code session close (DJ6-live pattern)
- Standalone testing → use `cmk-compress-lazy` instead (designed for manual invocation)

**Why:** Manual invocation during cut-gate testing created hung node processes. Understanding the hook-based design and correct testing patterns prevents this in future work.

**How to apply:** Never manually invoke cmk-compress-session from terminal. For session-end testing, close a real Claude Code window. For standalone testing, run cmk-compress-lazy.
