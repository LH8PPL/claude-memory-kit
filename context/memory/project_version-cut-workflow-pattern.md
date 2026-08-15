---
id: P-VJYGHNYN
type: project
shape: State
title: Version Cut Workflow Pattern
created_at: 2026-07-27T20:16:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7f7275001598a56a9b39e153a15fe92f7b994351757d0e054ba2d02339cc0fe0
related: [release-workflow-sequence, release-workflow-pattern, v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g]
---

Version cut execution follows this sequence:
- Per-rider cycle: implement → review → merge → housekeep
- After all riders complete: cut prep
- Cut prep ends with: release commit staged (not pushed/tagged)
- Final step: tag push by user (established as "the outward step")

**Why:** Clarifies the end-to-end process for v0.6.3 and future versions; establishes clean division: autopilot handles code-to-staged, user performs final tag push

**How to apply:** For future version cuts, follow the rider-housekeep pattern, stage the release commit at end of cut prep, and allocate the tag push to the user
