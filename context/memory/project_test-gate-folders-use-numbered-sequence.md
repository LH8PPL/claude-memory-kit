---
id: P-A7R47EB6
type: project
shape: Preference
title: Test Gate Folders Use Numbered Sequence
created_at: 2026-07-15T07:03:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bb31ab196aaf6673e1589a6a354e5129704cc2858e6a1b28b88a0b2de2772423
related: [version-0-5-4-tarball-ready-for-gate-testing, gate-testing-isolated-throwaway-folders, validate-references-requires-properly-filed-task-references]
---

Test projects follow pattern `C:\Temp\cut-gate##`, e.g., `C:\Temp\cut-gate23` for v0.5.4 rename gate.
Increment `##` for each new gate iteration.

**Why:** Numbered sequence avoids naming collisions and makes iteration history explicit.

**How to apply:** When running a new gate, create the next number in the sequence; don't reuse or branch gate folders.
