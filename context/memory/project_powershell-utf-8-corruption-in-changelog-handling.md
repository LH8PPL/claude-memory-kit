---
id: P-U7ZFC3PV
type: project
shape: Timeless
title: PowerShell UTF-8 Corruption in CHANGELOG Handling
created_at: 2026-08-03T07:12:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1cf065df1e297236988b2761ec1ae122abdebd0af93e66b6454ad8239dad1f9e
---

PowerShell corrupts UTF-8 when editing CHANGELOG. This session's near-miss (assistant almost committed corrupted CHANGELOG without notice) revealed this as a durable hazard for future sessions.

**Why:** Silent tool failures like UTF-8 corruption are expensive to debug repeatedly; capturing this prevents the same mistake recurring.

**How to apply:** When editing CHANGELOG with PowerShell in future sessions, verify UTF-8 output integrity, or use an alternative shell (e.g., Bash) for non-ASCII text operations.
