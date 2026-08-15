---
id: P-QJ73YHV7
type: project
shape: Timeless
title: One-Line-Pointer Design for Numbering Validator Consistency
created_at: 2026-07-27T21:53:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bc9684617c5768d6be42fe9fecf17b85b630264d058724014d30fe69269380f7
related: [byte-preservation-as-hard-constraint-for-archive-splits, file-pointer-format-and-interpretation, pointer-format-for-archived-task-entries]
---

The core-memory-kit uses a one-line-pointer design where every shipped task ID is kept in the live file to maintain numbering validator integrity.

**Why:** Archive operations and task sequencing can otherwise cause validator state divergence. Centralizing shipped task references in one location prevents ID collisions and consistency gaps.

**How to apply:** When working with archives or modifying task tracking, ensure shipped task IDs remain registered via one-line-pointers in the live file.
