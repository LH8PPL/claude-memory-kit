---
id: P-WJCLLKH6
type: project
title: Hand-edited fact carrying a UTF-8 BOM
created_at: 2026-07-25T10:00:00Z
write_source: manual-edit
trust: medium
source: context/memory/project_bom-hand-edited.md
source_line: 1
sha1: 0123456789abcdef0123456789abcdef01234567
---

A fact file a user hand-edited in a Windows editor. Windows PowerShell 5.1
Set-Content -Encoding utf8 prepends a UTF-8 BOM (EF BB BF) and writes CRLF
line endings; both must be tolerated by the kit frontmatter parser.

It links to [[bom-neighbour]] and cites D-403, so the graph edges built at
reindex are exercised from a real captured payload, not a synthesised string.
