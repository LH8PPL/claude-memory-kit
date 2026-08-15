---
id: P-2TUJKMP4
type: project
shape: Timeless
title: validate-references Requires Properly Filed Task References
created_at: 2026-07-06T12:02:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bc06171bee6b732c97e0c0d06b2998ba3a72d5cc42faf4c635d89bdff443f218
related: [decision-log-validation-gap-d-nnn-ids, tag-ready-criterion-core-features-pass-known-issues-cleanly, test-gate-folders-use-numbered-sequence]
---

The `validate-references` workflow validator fails if a task ID (e.g., "Task 202") is referenced in docs/commits but not formally filed in the project task system. During v0.4.5 cut, main turned red because D-281 cut-gate log referenced Task 202 without it being formally filed.

**Why:** Ensures all task references are traceable; caught a dangling reference during release

**How to apply:** When referencing a task in work, file it first; don't do work informally and reference it later
