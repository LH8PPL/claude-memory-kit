---
id: P-AA5X9LGY
type: project
shape: State
title: Task 210 — Deletion-propagation guarantee, in-flight (code done, docs/review pending)
created_at: 2026-07-16T08:18:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 32a72f37d80686d98c6d700273c8b6219c2cfbed9e632afd9f6a45da89ae007e
related: [health-check-hc-12-deletion-cascade-verification, task-completion-workflow-code-test-doc-review-live-test-merg, task-96-cmk-redact-purge-hard-merged-pr-295]
---

**Status:** Code complete and green (10/10 tests), paused on branch `task-210-deletion-propagation`
**Delivered so far:**
- deletion-propagation.mjs: cascade check (tombstoned facts verified gone from SQLite + recent.md/archive.md/today-*.md)
- HC-12 in cmk doctor: health check for cascade verification (currently fails naming surviving file + fact id, vacuously skips when nothing was forgotten)
- daily-distill forward-path screen: fresh summary drops already-tombstoned content
**Remaining work:** doc walk (HEALTH-CHECKS.md HC-12 row, lifecycle-map G-table, design.md, CLI.md, CHANGELOG, tasks.md, DECISION-LOG), full suite + stress, live-test, two-pass review, PR

**Why:** Current work-in-progress showing typical task completion path and phase sequence.

**How to apply:** Resume at doc walk phase; know that test suite is complete and likely passes stress testing too before docs begin.
