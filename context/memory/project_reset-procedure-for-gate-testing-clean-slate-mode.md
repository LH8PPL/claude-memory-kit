---
id: P-BLUaWBJM
type: project
shape: State
title: Reset Procedure for Gate Testing (Clean-Slate Mode)
created_at: 2026-07-02T19:04:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f2b4f3eaa96709be6e2f54c9e85676caa62d86528d16200d52b50a1dd6fe141b
related: [user-tier-memory-backup-before-testing, gate-preparation-tier-backups-and-dogfood-isolation, pre-release-testing-setup]
---

To run gate tests against a fresh installation state:
1. Backup ~/.claude-memory-kit to `C:\cut-gate-backups\user-tier_{TIMESTAMP}\`
2. Delete the original ~/.claude-memory-kit directory (clean state)
3. Run gate procedures (§2 onward)
4. Restore the persona: `Move-Item "C:\cut-gate-backups\user-tier_{TIMESTAMP}" $env:USERPROFILE\.claude-memory-kit`

Timestamp format: `YYYY-MM-DD_HH-MM-SS` (aids multi-run bookkeeping).

**Why:** Gate procedures (esp. B3/B4/B8) validate fresh-install behavior. Backup ensures zero data loss and easy rollback if needed.

**How to apply:** When running future gate tests, apply this backup-reset-test-restore cycle. The procedure keeps the real persona safe while testing against pristine state.
