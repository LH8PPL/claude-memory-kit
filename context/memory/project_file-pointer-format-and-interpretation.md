---
id: P-KHBKVE4N
type: project
shape: Timeless
title: File Pointer Format and Interpretation
created_at: 2026-07-27T23:04:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 379e1800ddb0face55548f65cd80fa8945637116f9917e63b3a59a3dc41e6b99
---

Pointers in live `tasks.md` are marked as `→ [archive](<path>)` and represent links, not entries. The file's "How to read this file" section must explain this so readers don't mistake pointers for task data or assume incompleteness.

**Why:** Readers unfamiliar with the archive structure can misinterpret truncated pointers.

**How to apply:** Ensure live file header explains that `→` marks a pointer. Test that pointers are not confused with entries.
