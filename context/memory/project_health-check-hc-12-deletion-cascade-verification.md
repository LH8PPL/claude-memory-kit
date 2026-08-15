---
id: P-RRA2F3PE
type: project
shape: Timeless
title: Health Check HC-12 — Deletion cascade verification
created_at: 2026-07-16T08:18:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5fb73a79436dd4a5e3a0071a69f212f80577d030459786000498f159b48d44f9
related: [task-210-deletion-propagation-guarantee-in-flight-code-done, cmk-forget-as-safe-fact-removal-method, index-md-is-a-committed-human-readable-artifact]
---

Currently in cmk doctor; verifies that facts marked for deletion are actually purged from SQLite index and all memory files (recent.md, archive.md, today-*.md). Known limitation: fails to name surviving file + fact id when cascade is incomplete; marks as "vacuously clean" when no facts have ever been forgotten.

**Why:** Part of the deletion-propagation guarantee (Task 210); HC-12 is the user-facing health check that certifies cleanup worked.

**How to apply:** When discussing deletion verification or the cmk doctor suite, reference HC-12 by number; know it needs naming improvement for incomplete cascades.
