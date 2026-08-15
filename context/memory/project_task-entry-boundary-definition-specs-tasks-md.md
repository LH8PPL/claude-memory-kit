---
id: P-KVFQaBQ2
type: project
shape: Timeless
title: Task Entry Boundary Definition (specs/tasks.md)
created_at: 2026-07-27T22:28:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0c002096609e46ba57f88e81923e54d74158d283d3f419d84ea99cee1a316527
related: [pointer-format-for-archived-task-entries, archive-eligibility-criterion-for-task-parents, version-snapshot-in-recent-md-guards-against-cross-session-a]
---

An entry runs from its parent line (level-1/2 heading or parent task item) through the next parent-level item, level-1/2 heading, or `---` rule. **Level-3 headings are entry-owned** — they travel with their parent entry (e.g., `### 38a.` with Task 38; `### Post-PR-31 audit campaign tracker` with Task 23).

**Why:** Prevents orphaning of entry-level metadata (sub-tasks, audit notes, decision substeps) when splitting into archives.

**How to apply:** When splitting tasks.md, use this rule to determine each entry's boundary. Verify that all level-3 content within an entry is followed by a parent-level item or rule.
