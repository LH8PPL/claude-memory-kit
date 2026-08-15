---
id: P-DQRCDVJJ
type: project
shape: Plan
title: Decide Cron-Reliability Backstop Strategy
created_at: 2026-07-22T07:40:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 12980d1223f8f1cac86e4e516aefe064b16348cf96c50052714ce25143a4f87f
related: [github-scheduled-workflows-can-miss-runs, standing-osv-advisory-surveillance-task-237-lane, v0-6-2-release-staging-task-248-timing-decision]
---

Two options: (a) secondary scheduled run at a different time to reduce chance both cron cycles miss, or (b) accept manual dispatch as the primary backstop and own the schedule. Prefer a decision recorded in the watch workflow config.

**Why:** GitHub's cron unreliability exposed in this cycle; Task 237's delivery depends on the watch running reliably.

**How to apply:** Document the chosen strategy in the watch workflow and release checklist before cutting v0.6.2.
