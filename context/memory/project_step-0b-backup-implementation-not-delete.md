---
id: P-Q2GEGHBU
type: project
title: Step 0b Backup Implementation (Not Delete)
created_at: 2026-06-26T15:28:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fe9472befe44458d8ab941a0ef9f32645518d508a53bd09071b01600fae20bdf
related: [persona-directory-moved-to-core-memory-kit, reset-procedure-for-gate-testing-clean-slate-mode, user-tier-memory-backup-before-testing]
---

- Moves `~/.claude-memory-kit` + stray `~/context/` to `C:\cut-gate-backups\user-tier_<stamp>`
- Includes restore note for recovery
- Replaces previous delete behavior for gate Step 0b

**Why:** Implements the standing backup-not-wipe rule for the gate process (user explicitly preferred this over deletion)

**How to apply:** When running v0.4.1+ gate, Step 0b auto-archives instead of deleting. No manual action needed; archive is reversible via restore note.
