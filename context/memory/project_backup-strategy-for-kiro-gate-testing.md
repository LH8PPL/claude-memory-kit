---
id: P-4HZAJ9X9
type: project
title: Backup Strategy for Kiro Gate Testing
created_at: 2026-06-23T15:06:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3a15b8005b5c476c0a0ca327967689c0ffd71bd3c57bc16be1179a089357e1db
related: [kiro-gate-0c-backup-recovery-procedure, cut-gate-sandbox-isolation, cut-gate-backup-convention]
---

Before running the Kiro gate test, isolate the real user config to prevent contamination:
- **Move** real user tier (`.claude-memory-kit`) to `run4-.claude-memory-kit` (numbered sequence, away from clean start)
- **Copy** `.aws` (preserve original in place, don't move)
- **Preserve** old backups (`run`, `run2`, `run3`) untouched
- **Track** in NOTES.md which files are KIT-WRITTEN (deleted on restore) vs user-written (preserve)

**Why:** The Kiro gate test requires a clean environment without existing user config, but the real config and credentials must remain restorable. This approach enables both safely.

**How to apply:** Before running `cmk install --with-semantic --ide kiro` in a fresh test directory, apply this named-backup pattern to isolate the real state.
