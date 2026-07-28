---
id: P-JZL3HYPP
type: project
shape: State
title: Archive Eligibility Criterion for Task Parents
created_at: 2026-07-27T23:04:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 57de5f483b084b461020e947f8827a626aeb0d6a8f2eb7b743325c53a0892f61
---

A parent task is archive-eligible only when the **PARENT *and every one of its sub-boxes*** is closed or spun off. This rule is now documented in both the live `specs/tasks.md` header and the archive header, with the exact phrasing of the criterion. Instruction: grep the entry for `- [ ]` before moving it to archive.

**Why:** A prior pass archived 8 parents (IDs 45, 46, 50, 51, 68, 76, 78, 116) with 21 open sub-boxes between them; review caught the miss and all 8 were restored. The criterion and its historical rationale are now in the file to prevent recurrence.

**How to apply:** At archive time, verify parent and all sub-boxes are closed before moving. Re-read the header rule before the next archiving pass.
