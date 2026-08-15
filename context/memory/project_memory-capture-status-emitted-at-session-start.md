---
id: P-WaA4WPBD
type: project
shape: State
title: Memory Capture Status Emitted at Session Start
created_at: 2026-07-20T09:34:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 016b224465a8bde50b076f09f7fe511be65f4772e007590da9bb8020d71c902e
related: [silent-failures-require-automatic-user-facing-surfaces, a-health-check-behind-a-command-does-not-surface-a-silent-fa, memory-tiers-carry-mission-context-only-the-user-s-project-d]
---

Memory capture failures (timeouts, missing previous session logs) are reported via automatic status line emitted in `inject-context.mjs:1097` via the `buildStatusLine()` function, which outputs to `systemMessage` (user-facing channel, not model-facing).

Output format: `⚠ memory captured N of M turns YYYY-MM-DD (reason if timeout/error)`

Behavior:
- Silent when healthy (no message)
- Reads previous session's log (current session has no data yet at SessionStart)
- Fails open if log is missing or malformed
- Shows success/timeout counts and window for diagnostics

**Why:** Provides automatic, non-disruptive visibility into a critical automatic subsystem without requiring user commands.

**How to apply:** When reporting health of automatic features, emit status to user-display channels (`systemMessage`) at natural breakpoints (session start, context injection). Keep messages terse when healthy, detailed when problems exist.
