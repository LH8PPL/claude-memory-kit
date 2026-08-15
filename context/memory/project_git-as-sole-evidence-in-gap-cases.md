---
id: P-GQ7BXW7B
type: project
shape: Timeless
title: Git as Sole Evidence in Gap Cases
created_at: 2026-07-20T13:49:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1268e5f3b4731ba81568ce5ce726f1078fc09a473962eab4cb9c3b309d9985a4
related: [task-174-deliverable-structure, skill-adoption-verification-standard, kit-s-strict-forward-reference-validation]
---

Git history is the only evidence available for reconstructing missing gap days (days with no harness session). Generalizing to other sources would require building for an impossible case — a day with evidence other than git is not a gap, so it already has a real record.

**Why:** This constrains design decisions. The feature isn't "pluggable evidence sources" but "git-only reconstruction for gaps". Trying to generalize would add complexity for zero benefit.

**How to apply:** When evaluating enhancements to Task 174 or similar backfill logic, remember gaps are gaps precisely because other evidence doesn't exist. Don't add multi-source adapters; keep it simple and git-focused.
