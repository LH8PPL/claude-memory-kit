---
id: P-DVV326E3
type: project
title: User-Tier Memory Backup Before Testing
created_at: 2026-06-30T20:28:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: dde739328086b15f2f8cd8cac64a41ee04e00b58234340ff27c93f4322e7380f
related: [reset-procedure-for-gate-testing-clean-slate-mode, pre-release-testing-setup, back-up-the-user-tier-before-a-cut-gate-never-plain-delete]
---

User-tier memory for `cmk` lives in `~\.claude-memory-kit`. Before running version-test probes (via `cut-gate.md`), back it up to prevent test writes from corrupting real work. Backup workflow:
```powershell
$stamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Move-Item $env:USERPROFILE\.claude-memory-kit "C:\cut-gate-backups\user-tier_$stamp"
```
Run tests. Restore afterward with `Move-Item` back.

**Why:** Test probes write to user memory; without backup, real memory state can be overwritten or corrupted during testing.

**How to apply:** Adopt as a standing pre-test step for any new `cmk` version test. The command is reusable; modify the backup destination path if needed.
