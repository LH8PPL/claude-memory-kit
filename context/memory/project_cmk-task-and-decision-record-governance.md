---
id: P-DW269VXT
type: project
title: cmk Task and Decision Record Governance
created_at: 2026-06-11T22:18:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8a22e694accb7850e44d78c06a14b70d3b0aff16
related: [task-filing-convention-with-metadata, task-queue-organization-naming-convention]
---

- Tasks assigned sequential IDs (142, 143, etc.) with optional letter suffixes (141a for subtasks)
- Decision Records (prefixed D-) document rationale for non-adopted proposals; enables future context
- Work organized by release lanes (v0.3.x currently active); tasks within each lane prioritized by value
- Dangling references are caught and backfilled during scheduling

**Why:** Codifies cmk's project management model — how work, decisions, and priorities are tracked

**How to apply:** Use sequential task IDs; create D-records for considered-but-rejected features; rank within lanes by impact/leverage
