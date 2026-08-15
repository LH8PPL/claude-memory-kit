---
id: P-FJa6A2HL
type: project
shape: Timeless
title: 'Post-Rename Guide Adjustment: §0 Backup Now Optional'
created_at: 2026-07-15T07:03:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 54c72a9dba3dc579608481da5801d2690bf6ff48f2c193b194fcf1d210d9b64d
related: [config-directory-migration-is-critical-blocker-for-rename, user-tier-backup-completed-for-cut-gate-1-prep, persona-directory-moved-to-core-memory-kit]
---

The cut-gate guide's §0 step assumes backing up `~/.claude-memory-kit` (old path). After rename to `.core-memory-kit`:
  - Old path already backed up (renamed to `.claude-memory-kit.backup`)
  - New path is clean (`~/.core-memory-kit` intentionally absent)
  - §0 can be skipped; start at §1 "Scaffold + read every file"

**Why:** Path migration makes the original §0 step redundant; tier setup is already complete.

**How to apply:** In future gate runs with users, note that §0 backup is satisfied by the rename work; direct them straight to §1.
