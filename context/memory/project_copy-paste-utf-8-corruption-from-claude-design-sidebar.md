---
id: P-QWLDZHBV
aliases: [P-QWLDZHBV]
type: project
shape: Absence
title: Copy-Paste UTF-8 Corruption from Claude Design Sidebar
created_at: 2026-08-05T20:42:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 88bcb02dbb22ee1fbfd85755921dd91a7fa5e8cb2aab55fbba6ccdb4d62dcf2b
related: [powershell-silently-corrupts-utf-8-in-file-edits, powershell-utf-8-display-artifact-in-cmk-cut-gate-validation, research-notes-indexed-via-research-index-not-documentation]
---

Pasting text via Claude Design sidebar causes UTF-8 mojibake when text contains special characters (em-dashes, section symbols). Characters are read as Latin-1 during transit: "—" becomes "â€", "§" becomes "Â§". Corrupts HTML/code validity.

**Why:** The pasted viewer-page.html had corrupted title and comments. Must use raw bytes, not transit-mangled copy-paste.

**How to apply:** Download files using the "Download [filename]" button in Claude Design sidebar, save to disk. Verify encoding (BOM, line endings) before working with the file.
