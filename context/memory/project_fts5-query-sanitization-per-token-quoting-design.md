---
id: P-2Qa3JA5W
type: project
title: FTS5 Query Sanitization — Per-Token Quoting Design
created_at: 2026-06-15T12:15:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: a88a3cbe4a35863060af2eda1a6e7b2006ff4b1dd366aee8d5171e6c4b38ae72
related: [fts5-query-sanitization-task-153]
---

Fix for v0.3 FTS5 crash via `prepareFtsQuery(raw)` helper in search.mjs, applied to `opts.query` before keyword search calls.

Approach:
- Tokenize user input on whitespace
- Quote tokens containing special chars (dots, hyphens) or reserved words (AND/OR/NOT, case-sensitive)
- Escape embedded `"` as `""` (SQL-style)
- Leave already-quoted phrases as-is
- Pass plain words through
- Rejoin with spaces

**Why:** Per-token quoting preserves implicit-AND between words (better recall for multi-word queries like "layered architecture"), while whole-query quoting forces strict phrase matching. Grounded in SQLite FTS5 primary docs.

**How to apply:** Write helper in search.mjs; apply as preprocessing before runKeywordSearch and runTranscriptKeywordSearch. Error path remains as fallback for unparseable queries.
