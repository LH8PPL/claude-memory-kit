---
id: P-HL3PTPZL
aliases: [P-HL3PTPZL]
type: project
shape: State
title: UTF-8 BOM Injection from PowerShell Round-Trips
created_at: 2026-08-03T18:26:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 509cdc7b366f571c0a6bcbf3b497fdcc26bd2a25e23683ce25687b76fa2a9c56
---

PowerShell round-trips can inject UTF-8 BOM into page content mid-work. Mitigation: byte-check for BOM presence and strip if found.

**Why:** Environmental hazard matching this morning's CHANGELOG incident; corrupts output silently and unpredictably.

**How to apply:** Integrate BOM-check into PowerShell processing steps; consider adding to CI gate to prevent regression.
