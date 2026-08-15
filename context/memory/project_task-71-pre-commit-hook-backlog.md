---
id: P-4P5379aN
type: project
title: Task 71 Pre-commit Hook (Backlog)
created_at: 2026-07-02T08:33:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e876b9d9538cebaf23baa66457054776083e604edbfc6baec5741c3f44810f35
related: [claude-md-checkpoint-4-pre-commit-screening-rule, v0-6-2-minor-release-gate-process-d-248-d-267-rule, dogfood-decisions-md-committed-post-merge-not-with-feature-p]
---

Task 71 is a pre-commit hook re-screening `context/` through Poison_Guard. Currently in backlog with "wait for an incident" trigger, but manual screening recurs at every task boundary (not automated). Related to a recent data-point recorded in Task 71 entry (commit cb506c3).

**Why:** Poison_Guard screens facts at write time, but the commit-boundary screen is hand-rolled; automating this would reduce recurring manual work

**How to apply:** Treat this as evidence the trigger is warmer than passive; consider prioritizing if dogfood flushes become more frequent
