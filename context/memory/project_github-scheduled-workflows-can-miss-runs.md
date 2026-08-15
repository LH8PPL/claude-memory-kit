---
id: P-E4aE423K
type: project
shape: Timeless
title: GitHub Scheduled Workflows Can Miss Runs
created_at: 2026-07-22T07:40:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7b4857260f4f4c6cbb7f7a818944e451b08f59f7ff1289dbd5bf024f8c12c0f2
related: [decide-cron-reliability-backstop-strategy, stress-gate-requirement-for-spawn-boundary-changes, sequential-gate-execution-required-first-invocation-gate-can]
---

GitHub's shared cron pool is not 100% reliable; scheduled runs may never execute. In this cycle, the watch's first run never happened, leaving a HIGH advisory undetected until a PR tripped the gate.

**Why:** Time-sensitive checks (dependency scanning, security advisories) must have a backstop to ensure they run even if the cron pool drops the cycle.

**How to apply:** Add a secondary scheduled time, or accept manual workflow dispatch as the primary backstop for critical time-sensitive checks.
