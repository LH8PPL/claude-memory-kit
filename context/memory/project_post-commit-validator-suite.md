---
id: P-XCTDZRCH
type: project
title: Post-Commit Validator Suite
created_at: 2026-06-15T07:17:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 024b44e4ac191ccd6de9b8c8a9d98094f09e4d20faf8aa8a0cd6bbdd55c8fa65
related: [stress-gate-release-workflow, release-plan-md-authoritative-task-to-lane-map, pre-commit-hook-sanitizes-fact-files-for-security]
---

Three validators run after commits to enforce consistency across files:
- **references:** Validates that all cross-file references (decision IDs, task IDs, etc.) exist and are valid.
- **name-privacy:** Ensures no secrets, tokens, or names leak into documentation.
- **numbering-gaps:** Checks for orphaned or skipped task IDs in the numbering sequence.
All should report green before shipping changes.

**Why:** Catch integration bugs early: dangling references, leaks, orphaned task IDs. These are easy to miss in manual review.

**How to apply:** After audits or major changes, run validators. Fix any failures before committing. A green run confirms all cross-file references are consistent.
