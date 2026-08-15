---
id: P-APWN7UPA
type: project
shape: State
title: P-RES031CG Malformed File Recovery Plan
created_at: 2026-07-25T10:04:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dabe99f953e3c512f711e5c54fda2d456f1d3c776f566438b659bfbf7949fb0f
related: [preserve-legacy-id-when-creating-derived-ids, run-cmk-register-crons-after-pr-351-ships, cmk-workspace-rename-invalidates-per-workspace-permissions-h]
---

**File**: P-RES031CG (malformed, discovered Task 232)  
**Issue**: Re-scanned on every boot since Task 232  
**Fix**: Running real install will repair it; its id will change to a derived id, with `legacy_id` field preserving the old string P-RES031CG for greppability  
**Status**: Pending housekeeping batch (PR #326 in progress)

**Why:** This file has been a recurring scan burden; real install is the corrective action that Task 248 validated

**How to apply:** After CI settles and real install runs, verify the file's new id in context/ and confirm `legacy_id: P-RES031CG` is present for searchability
