---
id: P-6U7SCR5a
type: project
title: Register Crons for Staleness/Starvation Prevention
created_at: 2026-06-20T11:27:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3e7751cb5e7ed5565f3a0f9a858761e8613d06a3ca22295e915cc70fc79e2775
related: [tag-and-publish-v0-3-5-release, core-memory-kit-installed-with-claude-code-hooks, scheduled-tasks-use-absolute-paths-renaming-requires-re-regi]
---

From C:\Projects\claude-memory-kit:
```powershell
cmk register-crons
cmk doctor    # HC-5 → PASS
```
Creates two Windows scheduled tasks:
- daily-distill: 23:00 every day
- weekly-curate: 09:00 Sundays

**Why:** Crons are the designed fix for staleness and cascade-starvation; background distill-curate cycle prevents memory degradation over time

**How to apply:** Run after v0.3.5 is installed locally; verify with `cmk doctor` HC-5 check
