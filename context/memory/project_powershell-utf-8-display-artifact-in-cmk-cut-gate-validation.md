---
id: P-EYGaT423
type: project
title: PowerShell UTF-8 Display Artifact in cmk Cut-Gate Validation
created_at: 2026-06-17T08:17:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 679e99ce9efc6fe6b59a8fb2b86bff5cb1e776992f2e727e66e35ac938a9bade
related: [powershell-utf-8-encoding-fix-for-cut-gate-g4-reads, copy-paste-utf-8-corruption-from-claude-design-sidebar, test-artifacts-can-contaminate-fresh-install-testing]
---

- PowerShell's `Get-Content` displays UTF-8 special characters (middots U+00B7, em-dashes) as mojibake (`ֲ·`, `ג€"`) on standard console
- File bytes are actually correct UTF-8 (verified via `[System.IO.File]::ReadAllText` or hex dump)
- Makes clean scaffolds *look* corrupted during G4 gate checks, causing false-positive validation failures in future setup runs
- **Workaround:** Read with `[System.IO.File]::ReadAllText` or set `[Console]::OutputEncoding = [System.Text.UTF8Encoding]::UTF8` before validation

**Why:** Prevents future cmk setup runs from falsely failing gate checks due to display artifacts masking correct file state on Windows

**How to apply:** Update cmk's cut-gate.md G4 read-command guidance to use UTF8-safe read method; document that standard Get-Content mojibake does not indicate file corruption
