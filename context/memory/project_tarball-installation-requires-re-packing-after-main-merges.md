---
id: P-PGRTL7DZ
type: project
shape: State
title: Tarball Installation Requires Re-packing After Main Merges
created_at: 2026-07-03T10:57:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 82a50e92080296f774491565f20ddf64bd0f6a71c5155185d73b3c4a9d2c4a33
related: [global-binary-lag-after-code-merge, tarball-artifact-must-carry-both-d-263-and-d-264, release-workflow-after-fix-merge]
---

The release workflow includes a tarball-based distribution:
- The installed tarball is a point-in-time snapshot of the built tool
- After merging fixes/changes to main, the tarball does NOT auto-update
- Step 0b must be run after a main merge: repack the tool from updated main and reinstall locally
- Example: after D-263 fix merges, must repack and reinstall before resuming downstream gates (Session 2)

**Why:** Without re-packing, the installed tool carries stale code and does not include newly-merged fixes

**How to apply:** After any main merge that affects downstream work, run step 0b to repack and reinstall before proceeding
