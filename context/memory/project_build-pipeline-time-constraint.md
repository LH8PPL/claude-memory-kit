---
id: P-L7HTEB5H
type: project
shape: State
title: Build Pipeline Time Constraint
created_at: 2026-07-29T07:47:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9fe71ac6e7913c9299689e26a4135e7889b4d7c33867598f34ac7d6bd0e06300
---

New features/fixes require build pass (two-pass review + CI), taking approximately one day or more ("day-plus"). This is the genuine scheduling constraint.

**Why:** Explains why work can't ship same-day even if ready; planning must account for this lag

**How to apply:** Factor day-plus build time into estimates; use to decide if work ships this release or next
