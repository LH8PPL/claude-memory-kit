---
id: P-7PGDAXCJ
type: project
shape: State
title: Task Filing Convention With Metadata
created_at: 2026-07-10T18:44:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8a8f8c4cd021525fe9b4a63dfde89b024c66dad3f258658d9fb30cacb625a56b
related: [release-version-queue-d-309, release-roadmap-v0-5-1-v0-5-4, cmk-task-and-decision-record-governance]
---

Tasks are filed with:
- Lanes and triggers per D-248 (formal metadata)
- Numerical IDs (209, 210, 211, etc.)
- Target version (v0.5.x, v0.5.1, etc.)
- Explicit dependencies via "rides" notation (e.g., "rides Task 194 Phase-2 batch", "rides the batch", "rides Task 96's governance slot")
- Cross-references to related tasks (e.g., 189↔212, 203/204)

**Why:** Task metadata enables dependency tracking, prioritization, and batch sequencing across releases.

**How to apply:** When filing new tasks, include lane/trigger, version target, and dependency chain. Reference related tasks explicitly. Use cross-refs to document relationships.
