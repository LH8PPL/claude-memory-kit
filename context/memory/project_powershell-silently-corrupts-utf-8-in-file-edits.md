---
id: P-SYGRXAHN
type: project
shape: Absence
title: PowerShell Silently Corrupts UTF-8 in File Edits
created_at: 2026-08-02T19:33:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 94d112d99114d73956f85966fd0a8289d4f04e1b49c64287ceef91b1f4837bcd
---

PowerShell mangles non-ASCII characters when editing text files — em-dashes `—` become `ג€"`, `§` becomes `ֲ§` — and adds UTF-8 BOM. In the v0.6.4 CHANGELOG edit, 435 characters were affected, producing a 472-line diff instead of the expected 6. Caught only via manual diff review before commit. Workaround: use Node.js or a text editor.

**Why:** Silent data corruption risks shipping corrupted files; diffing alone is an unreliable safeguard.

**How to apply:** Do NOT use PowerShell (`Set-Content`, `Add-Content`, etc.) for file edits in this repo; route through Node scripts or direct text editor operations instead.
