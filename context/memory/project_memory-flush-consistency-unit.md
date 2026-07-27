---
id: P-BKXE3ECQ
type: project
shape: Timeless
title: Memory Flush Consistency Unit
created_at: 2026-07-27T08:44:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cb88ebca5c8a433e7e4959b71e13f5fcb35ffff0356b66c37897b23eb520e321
---

Memory flushes must stage the **whole `context/` tier or nothing** — it is one logical consistency unit.
  - **Do not**: cherry-pick individual files from context/ or add selectively around it
  - **Do**: commit the entire `context/` state as one unit, or exclude it entirely from the commit
  - Exception: explicit-path rules apply only to files *outside* `context/`
  Partial staging violates internal consistency and triggers validation failures (e.g., staging INDEX.md without its fact files).

**Why:** Prior `-am` incident and today's INDEX.md half-state both show that surgical staging within `context/` breaks consistency invariants. validate-docs catches these as errors.

**How to apply:** On any memory-flushing commit, include all of context/ or none of it. Never do surgical edits within the tier.
