---
id: P-W372LWJa
type: project
title: cut-gate-backup-convention
created_at: 2026-06-21T14:29:00Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 60f53c266d71271e4586ab41137204bdcd5991f37e6a137abfe2ee77da9e91f0
related: [test-gate-protocol-backup-real-paths-instead-of-env-var-sand, kiro-gate-0c-backup-recovery-procedure, backup-strategy-for-kiro-gate-testing]
---

Cut-gate backups live in a central root C:\cut-gate-backups\, one folder per run named NN_version_gate (e.g. 12_v0.4.0_kiro), each holding BEFORE-/AFTER- snapshots + NOTES.md. NOT flat in the home dir anymore.

**Why:** Flat backups cluttered the home dir, had no structure, and were easy to fat-finger in cleanup. Central + structured = safe to bulk-manage and AFTER-snapshots are evidence to diff against the next run.

**How to apply:** Before a gate: back up ~/.claude-memory-kit (move) + ~/.aws (copy — real creds) into the run folder. After: copy AFTER- artifacts, restore the user tier, delete only the cmk agent files from ~/.aws. The Kiro gate (cut-gate-kiro.md §0c/Verdict) encodes this; scripts/maintenance/migrate-cut-gate-backups.ps1 consolidated the old flat ones.
