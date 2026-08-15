---
id: P-4FNXP9FS
type: project
shape: Event
title: 'Gate Preparation: Tier Backups and Dogfood Isolation'
created_at: 2026-07-12T12:32:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c2c862b43725a99507c42b69c7514a4c4fc00fa2539a19f65ba45171e4cb7115
related: [user-tier-backup-completed-for-cut-gate-1-prep, reset-procedure-for-gate-testing-clean-slate-mode, dogfood-repopulates-user-tier-during-active-sessions]
---

**Backup location:**
- Real persona saved to `C:\cut-gate-backups\user-tier_2026-07-12_14-49-40` (for restoration after gate)
- Live tier cleared: `~/.claude-memory-kit` absent ✓

**Dogfood Stop-hook quirk:**
- This Claude Code session (running on this repo) triggers auto-extract each turn, may recreate `~/.claude-memory-kit`
- Gate Session 1 runs in separate project `C:\Temp\cut-gate-v051` — fills its own isolated tier
- Before running gate's §2 build, verify tier is still absent (clear again if dogfood recreated it)

**Post-gate restoration:**
Restore real persona via: `Move-Item "C:\cut-gate-backups\user-tier_2026-07-12_14-49-40" $env:USERPROFILE\.claude-memory-kit`

**Why:** Gate tests persona auto-fill from zero (B3/B4/B8 checks). Separate project + clean tier ensures honest test. Dogfood auto-extract is expected this session but requires isolation knowledge to avoid interference.

**How to apply:** Use these backup paths. Before running gate's §2 build, verify `~/.claude-memory-kit` does not exist (clear one more time if needed). Run gate in C:\Temp\cut-gate-v051. After completion, run the Move-Item restore.
