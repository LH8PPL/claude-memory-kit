---
id: P-4aRS5H6T
type: project
title: Clean-Start Procedure for Session 1 Test
created_at: 2026-06-14T10:05:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f73b9f9c317397a541a9e68948ce877b1cb239ab7aa71030c3313eba879e8dd3
related: [claude-memory-kit-installation-levels, verification-sequence-for-task-169-170-fresh-folder-gate, gate-preparation-tier-backups-and-dogfood-isolation]
---

- Backup existing user-tier (optional): `Copy-Item -Recurse $env:USERPROFILE\.claude-memory-kit $env:USERPROFILE\.claude-memory-kit.bak`
- Remove user tier: `Remove-Item -Recurse -Force $env:USERPROFILE\.claude-memory-kit`
- Create project: `mkdir C:\Temp\cut-gate-s1; cd C:\Temp\cut-gate-s1`
- Init repo: `git init`
- Install cmk: `cmk install --with-semantic`
- Verify: `cmk doctor` (expect 5 pass · 0 fail · 3 skip, 0 facts)
- Open editor: `code .`
- Restart Claude Code in that window so hooks re-wire

**Why:** Ensures B3/B4 cross-project persona capture can verify uv/ruff rule lands from zero; prevents pre-seeding contamination

**How to apply:** Run this sequence before starting Session 1 staged FastAPI build; do not reuse cut-gate10
