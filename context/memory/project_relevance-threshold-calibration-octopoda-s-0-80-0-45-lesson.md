---
id: P-692R5VaA
type: project
shape: State
title: Relevance Threshold Calibration — Octopoda's 0.80 → 0.45 Lesson
created_at: 2026-07-22T17:04:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c2ca4ce23d8049a6badf071967cfcd6661d69ff2405af67bbbc87c9ee5b8aca2
related: [relevance-floor-calibration-for-fts5-backends]
---

Octopoda initially set 0.80 relevance floor for fact retrieval/hint injection; this filtered out 5 of 7 relevant facts. Lowering to 0.45 improved coverage.

**Why:** Threshold tuning in retrieval systems is non-obvious. A seemingly safe (0.80) floor can be too aggressive, suppressing relevant signals. Applies to Task 233 (recall-nudging validation) and hint-injection logic.

**How to apply:** Start conservative (0.45–0.60) and measure coverage against ground truth. Octopoda's experience suggests 0.80 is too high for typical use.
