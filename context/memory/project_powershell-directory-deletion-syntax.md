---
id: P-BNaQHZ99
type: project
shape: Timeless
title: PowerShell Directory Deletion Syntax
created_at: 2026-07-22T08:29:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 87a51704d5bf2885dfe79ad3b8d8dad6351db9302a654f008dc88f33040f0c98
related: [bash-tool-cwd-persists-cd-into-a-workspace-silently-reroutes, windows-npm-eperm-warning-on-better-sqlite3-node-is-benign]
---

PowerShell's `rm` is an alias for `Remove-Item` and does NOT accept bash-style flags.

- **Command to delete:** `Remove-Item -Recurse -Force "path"`
- **Command to verify:** `Get-ChildItem -Recurse -Directory -Filter context packages | Select-Object FullName`
  - Returns nothing (or "not found") if directories are gone

**Why:** User's primary shell is PowerShell on Windows; bash syntax like `rm -rf` causes ParameterBindingException errors.

**How to apply:** Emit PowerShell-correct commands in hand-typed instructions for this project. Always test locally before providing as paste-ready one-liners.
