---
id: P-XGASCFaJ
type: project
shape: Timeless
title: Line-Ending Normalization Risk in Python Rewrites
created_at: 2026-07-20T13:49:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e3867b5ae26f259cfccf8e7e8c425bf0874961518d2eae34b90dfade9d383793
related: [extend-file-rewrite-rule-to-all-tools, file-pointer-format-and-interpretation, powershell-utf-8-corruption-in-changelog-handling]
---

Python-based whole-file rewrites can normalize line endings (e.g., CRLF → LF or vice versa), breaking tools like vitest that depend on consistent file structure. The issue surfaced when rewriting a test file.

**Why:** Python's text I/O defaults may not preserve the original file's line-ending convention. In mixed-OS repos, this causes silent failures that are hard to debug.

**How to apply:** When rewriting test files or repo files from Python, explicitly preserve the original file's line-ending style. Open with newline='' and detect/restore the original convention.
