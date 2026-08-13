---
id: P-HS76QXSV
type: project
shape: Timeless
title: Catch Task/Changelog Version Mismatches Pre-Release
created_at: 2026-07-20T20:58:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0da8ebf62735c79c5c679174c1cbbcd1bb8e8b1a0e901febd393c7544573b1af
related: [release-workflow-tag-before-merging-new-work, tag-ready-criterion-core-features-pass-known-issues-cleanly, changelog-unreleased-auto-reset-during-release]
---

Task tracking errors—shipped task ticked under the wrong version, changelog entry filed under the wrong version number—should be caught before shipping, not caught by user review post-release.

**Why:** User review is a safety net for high-impact issues, not a substitute for process discipline. v0.6.1 had a version mismatch caught only when the user noticed the task status.

**How to apply:** Pre-release checklist: verify task status matches the version it's ticked under, and that changelog entries are filed under the correct version section. Catch discrepancies yourself.
