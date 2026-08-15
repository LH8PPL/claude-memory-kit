---
id: P-AZ54A745
aliases: [P-AZ54A745]
type: project
shape: Timeless
title: '"#356 Dispatch Agent Killed → Fix Batch Does Not Auto-Start"'
created_at: 2026-08-10T12:15:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1899dd1c4eabcdd14b91e46be07b25c40edb408dd99f21601c2233aaeb2f6541
related: [durable-state-first-principle, memory-auto-injection-on-session-start, sonarcloud-quality-gate-posts-as-github-check-runs-not-workf]
---

When the dispatch agent is killed before a fix batch launches, the batch does not execute — silent no-op, no error raised. The batch is queued to auto-re-dispatch on next session start.

**Why:** Explains why work may appear complete (marked done) but has no visible output; guides debugging and recovery

**How to apply:** If a batch seems complete but shows no work result, check if the agent was killed; all queued batches auto-resume on next session start
