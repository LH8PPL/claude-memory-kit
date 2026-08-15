---
id: P-KH4SRW5X
type: project
shape: Plan
title: Cursor Gate Test Path & Procedure (v0.5.0 Release)
created_at: 2026-07-09T18:21:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1ea60d594eaeccf3f34d69f6ce49e9fef2696e977323c9c3684e5c1fc513fef6
related: [cursor-gate-v0-5-0-test-procedure, release-workflow-after-fix-merge, v0-5-0-shipped-2026-07-10-npm-lh8ppl-cla-pyra4u7u]
---

To execute the Cursor gate test:
1. Fully quit and reopen Cursor
2. Open the folder: `C:\Temp\cursor-gate-v050e` (contains the fixed v0.5.0 binary)
3. Run the S1 build arc (Kiro prompts), stating preferences casually
4. Verify that now.md fills with both user and assistant turns and auto-extracted facts land
5. This closes the Cursor gate and clears the path to v0.5.0 tag

**Why:** This is the final gate before v0.5.0 release. Windows Cursor capture bugs (D-305 path, D-306 BOM) are fixed. Claude and Kiro gates already passed.

**How to apply:** Reference this procedure when ready to run the Cursor gate re-run; it's the last step before tagging v0.5.0.
