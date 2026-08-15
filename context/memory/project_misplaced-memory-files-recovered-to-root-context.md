---
id: P-L3PXDCSG
type: project
shape: Event
title: Misplaced Memory Files Recovered to Root Context
created_at: 2026-07-22T08:27:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5bb28eb7bb42b207d0d5eee3712d33aea3eefb056dbb4899f0f9cf43e6f56bc0
related: [task-246-phase-2-redirect-capture-hook-bins-to-root-resolver, faithful-relocation-for-memory-migration-in-core-memory-kit]
---

Six memory files incorrectly written to nested package directories (packages/cli/context/ and packages/cli/src/context/) were recovered via faithful file relocation, preserving original metadata (created_at dates, ids). Recovery committed as d62b18e. Both source directories (gitignored/untracked) subsequently deleted.

**Why:** Task 246 recovery — ensuring memories written through capture-hooks end up in context/memory/ (root) rather than package-nested locations.

**How to apply:** If similar misdirection issues arise, faithful relocation preserves historical accuracy. Cleanup of empty directories is safe and produces no git changes since they were untracked.
