---
id: P-YE9VP2NK
type: project
shape: Plan
title: Kiro Gate §0c — Backup & Recovery Procedure
created_at: 2026-07-09T09:38:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: fde18bc498071e5c4937d22a1502f4f95e818a9244088fa8737e92277b09518e
related: [backup-strategy-for-kiro-gate-testing, cut-gate-backup-convention, gate-preparation-tier-backups-and-dogfood-isolation]
---

Before running the gate, execute this backup & clean procedure:

**Backup steps (PowerShell §0c block):**
- Move `~/.claude-memory-kit` aside to `C:\cut-gate-backups\<run-id>\$run-.claude-memory-kit` (user tier; preserves for later restore)
- Copy `~/.kiro` to `C:\cut-gate-backups\<run-id>\$run-.kiro` (preserves user agents + settings)
- Record pre-existing agents from ~/.kiro in `NOTES.md` (to identify what is KIT-WRITTEN vs. USER-AUTHORED on restore)

**Verification (G0-backup):**
- Backup dir exists with both `.claude-memory-kit` and `.kiro` copies
- `~/.claude-memory-kit` is absent locally (moved, not copied)
- `~/.kiro` still in place (only copied)

**Recovery (after §3):**
- Restore `~/.claude-memory-kit` from backup verbatim

**Why:** The gate measures cmk in isolation; user-level artifacts must not interfere. User's real Kiro agents + settings survive via backup, enabling clean restore.

**How to apply:** Run the §0c PowerShell script. Verify G0-backup passes before proceeding to §2 stages. After §3, restore `~/.claude-memory-kit` using the backup path recorded in `NOTES.md`.
