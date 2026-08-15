---
id: P-79TK4TaF
type: project
title: Memory Kit Index File (INDEX.md) Architecture
created_at: 2026-06-18T06:53:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0b757025837522d26a5058025eb50ff752896c3150ad54895c69c587bb41da44
related: [task-159-auto-updating-decision-journal, journal-staleness-check-uses-index-md-mtime-proxy, index-md-is-a-committed-human-readable-artifact]
---

**What:** INDEX.md is the kit's unified metadata index. It contains pointers/listing for all memory facts in the project.

**Maintenance:** The kit automatically touches (writes to) INDEX.md on every fact save, keeping it current with the full fact set.

**Size:** Currently ~307 fact files per project. INDEX.md is the single metadata backbone.

**Usage:** Systems needing to detect "did anything new arrive?" can check INDEX.md's timestamp instead of stat-ing all 307 files. Saves ~130ms per full-directory scan.

**Why:** This is the kit's internal architecture. Understanding it is key to designing efficient session-start logic (e.g., Task 159's decision journal refresh).

**How to apply:** Trust that INDEX.md is always current — the kit maintains it. Use it for quick "anything changed?" queries. Do not try to manually update it; the kit is authoritative.
