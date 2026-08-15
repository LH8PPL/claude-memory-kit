---
id: P-T9PQFN5E
type: project
shape: State
title: Nightly Cron Fails Due To WakeToRun=False
created_at: 2026-07-08T12:43:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 92e667e4821580ed1ff19cebe0db1bcfe8e960f7461ce75ecdbef06876d1d4cb
related: [hc-10-reports-success-while-cron-fails, distill-completes-3-4-min-on-1500-facts, daily-distill-starvation-cron-killed-at-23-00-both-safety-ne]
---

- Task has WakeToRun=False, StopIfGoingOnBatteries=True
- Distill takes ~3.4 min on 1500 facts
- Machine sleeps/logs off at 23:00, killing task mid-run
- Error code: STATUS_CONTROL_C_EXIT every night
- Sibling ytslide task at same time completes (is faster)

**Why:** Cascading failures — each night's cron dies, HC-10 doesn't catch it, outage accumulates

**How to apply:** Register-crons should set WakeToRun=True; monitor task completion not just start
