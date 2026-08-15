---
id: P-E9GEZARN
type: project
title: 'HC-10: Proactive Dead Cron Detection (Question 7)'
created_at: 2026-06-25T20:12:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 35ad3572ec24376b0b0accbe4c919235803a8b26369ab1cf6de8d107975ff6a9
related: [hc-10-compaction-liveness-diagnostic-dev-nice-to-have, task-167-drop-hc-10-doctor-check-keep-only-the-free-auto-log, auto-heal-path-for-v0-4-1-task-167-d-169-binding]
---

HC-10 (`cmk doctor` health check) should detect dead crons proactively:
- Read `cronStale` and `heartbeatAge` from `isCompactionNeeded` (single source, no separate liveness checks).
- Flag dead crons even when `now.md` is empty (catches scheduler failures independently of current bloat).
- User message: "Self-heal still works automatically; your scheduler is dead" — frames as degraded optimization, not data loss.
- Never prescribe manual healing — automatic lazy heal is the floor and primary safety mechanism.
- Position as optional safety net for curious/concerned users, not a required fix (since `cmk doctor` is user-triggered).

**Why:** Catches scheduler liveness independently from bloat state. Distinguishes reactive safety (automatic heal) from proactive optimization (scheduled compaction). Single source prevents drift and future confusion about where truth lives.

**How to apply:** Implement HC-10 to read only `isCompactionNeeded` result; frame dead cron as OS/scheduler issue, not a memory problem; always reassure that automatic healing is working.
