---
id: P-3GPCJWXQ
type: project
title: Cut-Gate Sandbox Isolation
created_at: 2026-06-18T08:25:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f8258c5dcdb1450aacfceb37abb202f79f7f2a0422f1db8573c6d891ed129332
related: [gate-testing-isolated-throwaway-folders, backup-strategy-for-kiro-gate-testing, reset-procedure-for-gate-testing-clean-slate-mode]
---

To safely test `cmk install` without corrupting the user's actual memory setup:
- Create a fresh, empty project folder (not this repo)
- Set `MEMORY_KIT_USER_DIR` environment variable to a temporary directory (e.g., `C:\Temp\cut-gate-v0.3.3\_user\`)
- This isolates both project-level memory (`context/` fresh scaffold) and user-level memory (`~/.claude-memory-kit` equivalent)
- After testing, both folders can be deleted safely

**Why:** Install flows write memory files. Testing against real setup risks data loss or corruption.

**How to apply:** Before `cmk install`, `export MEMORY_KIT_USER_DIR=<temp-path>` and scaffold the project in a sibling clean folder.
