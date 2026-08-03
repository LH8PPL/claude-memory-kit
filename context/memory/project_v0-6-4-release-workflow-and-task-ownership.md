---
id: P-A7ZJG3EQ
type: project
shape: State
title: v0.6.4 release workflow and task ownership
created_at: 2026-08-02T19:23:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d79dbe628ba4f8ca80de4e76425b7daefb6f9c1ba4ae6848186d9f42d3e90ad6
---

Release sequence:
1. PR #336 merges (with green checks)
2. Add CHANGELOG entry for retry action
3. Run `npm run release`
4. Docs walk (assistant responsibility)
5. Tag push (user responsibility — do not tag until user confirms)

Status as of 2026-08-02: PR #335 merged with all remote gates green; Task 258 closed by evidence; PR #336 open with checks running.

**Why:** Defines the exact release workflow, task ownership, and handoff point. The tag push is user-controlled; this boundary should be maintained in future releases.

**How to apply:** After "Docs walk", halt and await user confirmation before pushing the tag. Reference this workflow for future release cut procedures.
