---
id: P-32TD3JaT
type: project
title: 'CMK Tool Invocation: cmk-compress-session vs cmk-compress-lazy'
created_at: 2026-06-18T12:58:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f0c4be07d6d5ab2a078d45e318c75278d8d5e48c2b8c7239acffcf44e7886386
related: [cmk-compress-session-requires-sessionend-hook-invocation-man, cmk-compress-session-must-be-invoked-by-54x6d2dm, research-notes-indexed-via-research-index-not-documentation]
---

- `cmk-compress-session`: Meant to be invoked BY Claude Code at session-end. Running manually in terminal causes hangs (stdin/TTY or model spawn issues).
- `cmk-compress-lazy`: Standalone-friendly equivalent; safe for manual testing.
- Correct test paths: use `cmk-compress-lazy` for manual verification, or trigger via Claude Code session close (DJ6-live).

**Why:** Manual testing of cmk-compress-session led to confusion and hung processes; understanding the tool's intended context prevents wasted debugging.

**How to apply:** When testing compression/journal features, use cmk-compress-lazy or trigger via Claude Code session close, not cmk-compress-session from terminal.
