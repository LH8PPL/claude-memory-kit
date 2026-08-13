---
id: P-UVEYS5ZL
type: project
shape: State
title: CHANGELOG [Unreleased] Auto-Reset During Release
created_at: 2026-07-12T18:00:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7ca22e98531eab218b85f98c12cf8fdb1b46475a2dede0f913e63a9f96f2b9e8
related: [minor-release-triggers-backlog-sweep, post-release-documentation-reconciliation-workflow, catch-task-changelog-version-mismatches-pre-release]
---

The release automation (part of the publish workflow) automatically resets the [Unreleased] section in CHANGELOG after a version is published. The released version gets a [Version] header with a date; a fresh [Unreleased] skeleton is generated for the next development cycle.

**Why:** Eliminates manual post-release housekeeping; ensures CHANGELOG is always ready for the next cycle.

**How to apply:** Do not manually reset [Unreleased] when cutting a release. Verify post-release that [Unreleased] is present in CHANGELOG. If it's missing, the automation may have failed.
