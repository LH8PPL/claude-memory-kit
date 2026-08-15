---
id: P-CL9DBDJK
type: project
title: Stub Command Removal — Five-Piece Pattern
created_at: 2026-06-11T04:41:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c459b1cdb4a0dae34f21504c90c519d52c1db66a
related: [work-items-require-task-entry-before-implementation, windows-rmsync-cleanup-flake-workaround, multi-surface-documentation-architecture]
---

Task 131 deletes the `cmk view` stub command. Complete removal requires five file edits:
  - Remove the command implementation
  - Remove parity-guard entry
  - Remove CLI.md section
  - Remove validator allowlist entry
  - Remove cut-gate line
  - Auto-generated contract test is deleted along with the stub (1718 tests remaining)

**Why:** Stub deletions touch multiple locations across the codebase; recording the pattern prevents incomplete removals.

**How to apply:** When removing a future command stub, verify all five locations are cleaned and rerun the test suite to confirm contract tests were pruned.
