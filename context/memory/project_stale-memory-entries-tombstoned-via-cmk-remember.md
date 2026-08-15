---
id: P-9VFRUHaZ
type: project
shape: Timeless
title: Stale Memory Entries Tombstoned via `cmk remember`
created_at: 2026-07-21T18:17:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7e12dee09586c95cdf8eeb0c60fe7079dbc41a0ca593486e69148993ce6a8f58
related: [task-243-2026-07-21-superseded-the-bench-storage-allowlist-c, kiro-agent-must-be-global-empirically-validated, memory-auto-injection-on-session-start]
---

- Kit memory entry "bench-storage allowlist must NOT be emptied" became stale after Node 22 floor bump
- Updated via `cmk remember` (core-memory-kit's built-in command)
- Tombstoned entries prevent future resurrection of outdated rules
- Recorded in D-387

**Why:** Stale memory can block justified changes. Tombstoning marks entries as superseded and stops them being restored from old snapshots.

**How to apply:** When a project fact is contradicted by new setup, use `cmk remember` to tombstone. Creates audit trail and prevents stale rules from re-activating.
