---
id: P-FUW47LTE
type: project
shape: Timeless
title: cmk forget as Safe Fact Removal Method
created_at: 2026-07-12T18:09:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e8ae5cc2453af75f1241cdab9ff8b4d1da36df5301f525462b527daaef2ec31b
related: [proper-verb-for-clearing-stale-locks, dogfood-memory-contamination-in-v0-5-1-release, non-destructive-flagging-with-blocked-placeholders]
---

Use `cmk forget` to remove facts; it tombstones them (recoverable in `archive/tombstones/`). Never hand-delete memory files.

**Why:** Safety and reversibility prevent loss of facts removed in error; critical for dogfood extraction cleanup

**How to apply:** For contaminated, duplicate, or stale facts, use cmk forget instead of file deletion
