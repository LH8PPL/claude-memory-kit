---
id: P-GZUSMZVQ
type: project
title: PowerShell UTF-8 Encoding Fix for Cut-Gate G4 Reads
created_at: 2026-06-17T08:20:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 485d7fc4f584078ae9fd1918d93a17aeda64109c13f1c8bbe63b891f30b7c278
related: [powershell-utf-8-display-artifact-in-cmk-cut-gate-validation, sonarcloud-then-in-object-false-positive-schema-fields, pre-roll-now-md-excluded-from-commit-offers-to-prevent-unscr]
---

When reading seed files in cut-gate.md G4 verification (sections 0–1), set `[Console]::OutputEncoding = UTF8` before reading, then use `[System.IO.File]::ReadAllText()` instead of `Get-Content` to display UTF-8 characters (·, —) correctly. Fix committed 7fabe17.

**Why:** Get-Content on Windows console displays UTF-8 middots/emdashes as mojibake characters, causing false-positive "corruption" flags during verification

**How to apply:** Apply this pattern in any cut-gate guidance that reads text files; document it so future runners don't false-flag display artifacts
