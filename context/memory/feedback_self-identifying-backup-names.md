---
id: P-BYPATXDD
type: feedback
title: self-identifying-backup-names
created_at: 2026-06-22T18:21:50Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 527a69db5295930c28f7bb0157cf43f9f409e5d7efaedd6fd41a3b57bf692632
related: [never-overwrite-backups, gate-check-g0-cli-version-verification, cut-gate-backup-convention]
---

Backup snapshot folder names must be self-identifying — prefix each snapshot with the full run/backup name, e.g. '12_v0.4.0_kiro_run2-.claude-memory-kit', NOT a generic 'BEFORE-.claude-memory-kit'. So a snapshot tells you which run it came from no matter where it's moved/copied.

**Why:** Generic BEFORE-/AFTER- prefixes lose which gate run they belong to once copied out of the run dir; a run-prefixed name is unambiguous evidence.

**How to apply:** When backing up, name each snapshot <run-name>-<original-dir>, e.g. '12_v0.4.0_kiro_run2-.aws'. Update any restore script that reads BEFORE-* to read the run-prefixed names.
