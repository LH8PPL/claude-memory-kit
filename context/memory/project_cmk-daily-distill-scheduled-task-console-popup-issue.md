---
id: P-7A6KVXV4
type: project
shape: State
title: cmk-daily-distill Scheduled Task Console Popup Issue
created_at: 2026-07-11T10:06:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a97499308ffa49ecbc7afcdaf83878dba75ad57bc6d33b4541d336cd10e134ca
related: [cmk-daily-distill-scheduled-task-window-popup-at-23-00, the-nightly-distill-schtask-can-be-triggered-on-demand-schta, cron-job-registration-feature-hc-5]
---

- **Task:** `cmk-daily-distill` (nightly scheduled task)
- **Issue:** Unwanted console-window popup during nightly execution (observed at 23:01)
- **Root cause:** Task launched with visible console window
- **Fix approach:** Windowless-launch configuration via `register-crons` script
- **Tracking:** Task 215 (implementation + unit-test autopilot; live verification flagged for user)

**Why:** Console popup disrupts nightly automation; next session needs to know the issue scope and fix approach for Task 215 execution.

**How to apply:** When Task 215 is active, implement windowless-launch via `register-crons` and unit-test; then coordinate with user for live registration verification on the real host scheduler.
