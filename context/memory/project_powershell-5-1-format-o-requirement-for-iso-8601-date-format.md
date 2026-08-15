---
id: P-G92GKGUD
type: project
title: PowerShell 5.1 `-Format o` Requirement for ISO 8601 Date Format
created_at: 2026-06-21T15:01:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 00d0953f79883ad04c436c865c85d2b35c2dc1e96a0df0cb2bf504984d3ac8df
related: [powershell-glob-behavior-explicit-filename-required-for-tgz, kiro-cli-env-passing-limitation, npm-glob-expansion-fails-in-powershell-use-explicit-filename]
---

In Windows PowerShell 5.1, `Get-Date -o` is ambiguous and matches other parameters (`-OutVariable`, `-OutBuffer`). Use the full parameter name `-Format o` instead.
- ✅ Works in PS 5.1: `Get-Date -Format o`
- ❌ Fails in PS 5.1: `Get-Date -o` (ambiguous)
- Note: `-o` shorthand only works in PowerShell 7+

**Why:** The gate's NOTES.md header line was failing due to this ambiguity; documented fix is now in the guide

**How to apply:** When generating ISO 8601 timestamps in Windows PowerShell 5.1 scripts, always use `-Format o` (full param), not `-o` shorthand
