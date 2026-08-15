---
id: P-PJB2L2JE
type: project
shape: Timeless
title: Use Deterministic Comparators for Sorting Committed Files
created_at: 2026-07-20T19:41:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: da4f0fbfa4d78f04018e9cd0d3b47c392ff94987f30ec3943a85e2effbfc3aef
related: [cross-machine-file-sorting-must-be-byte-deterministic, map-module-sort-determinism-localecompare-banned-explicit-or, task-140-has-byte-identical-output-hard-constraint]
---

When sorting committed files (e.g., INDEX.md), use an explicit, deterministic comparator instead of locale-based collation (localeCompare). Locale sorting varies by system, making committed content non-reproducible across machines.

**Why:** Committed files must produce identical sorted output everywhere; locale collation breaks reproducibility

**How to apply:** In Array.sort() operations on committed file data, use an explicit deterministic comparator; avoid localeCompare and default sort
