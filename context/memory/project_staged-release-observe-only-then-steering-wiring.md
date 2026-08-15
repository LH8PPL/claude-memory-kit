---
id: P-EQLWWGUF
type: project
shape: State
title: 'Staged Release: Observe-Only Then Steering Wiring'
created_at: 2026-07-07T12:27:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 88cd0e3b1a5a234c7dd498280da7f5082ceacc80f622bc1fb4c1da7751f52ef4
related: [release-gate-criterion-dogfooding-signal-validation, release-gate-cut-gate-guide-must-pass-before-tagging, release-cut-gate-validation-pattern]
---

The memory kit follows a phased approach where Phase 1 (judgment, corrections, trust scoring) ships observe-only as v0.5.0, and Phase 2 (wiring trust scores into ranking via task 194) ships as v0.5.1 after real-world validation. In Phase 1, signals are logged to `trust-signals.log` but do NOT affect search ranking. Task 194 will blend these signals into BM25 ranking.

**Why:** Prevents silent steering failures on day 1. Sensors run unobserved first, creating a baseline. If judge detection misfires, the issue is visible in logs before ranking is affected. Also: task 194 is the highest-stakes surface and should not ship at fatigue peaks.

**How to apply:** Release v0.5.0 now. Dogfood this repo for days, inspect `trust-signals.log` for sane deltas and no anomalies. Use that empirical evidence as the gate criteria for 194.
