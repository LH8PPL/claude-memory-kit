---
id: P-DNCA63PN
type: feedback
shape: State
title: 'A background job''s completion notification cannot survive the session dying: the'
created_at: 2026-07-21T20:04:11Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: b76ff25c643cb92326836d4a94e21666f751eef50695ebe855510ec7a88f883c
related: [vitest-output-buffering-and-process-verification, open-cmk-mcp-per-tool-prompt-systematic-investigation-pendin, task-95-dream-re-curation-path-settled-2026-07-17-ship-v0-5]
---

A background job's completion notification cannot survive the session dying: the job is a child of the session process and dies with it, silently, and no timeout on the CHILD helps — the child is not hanging, it is gone. After ANY session interruption/resume, re-verify every background job's liveness from ground truth (process table for heavy workers, output-file mtime+size growth) BEFORE reporting it as running or waiting on it.

**Why:** 2026-07-21: a session death killed a running stress gate and a review agent; the resumed session reported both as 'running' from stale spawn records, and only the user's 'you died' surfaced it. Second instance of the fabricated-liveness class (first: the Task-235 review agent, 54 min at 0 bytes).

**How to apply:** On resume: tasklist/ps for the expected worker processes, stat the output file for size AND mtime-vs-now, and only then report state. A wait must always pair with a liveness signal the waiter verifies itself; 'no notification yet' is not evidence of progress.
