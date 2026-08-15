---
id: P-aRUCEJ6E
type: project
title: FTS5 Query Sanitization (Task 153)
created_at: 2026-06-15T12:04:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2daae2441b562ae8ab937cf31d400fecbbe2bb6657fdecc91c88080d073e5471
related: [fts5-query-sanitization-per-token-quoting-design, fts5-tokenization-quirk-with-version-identifiers]
---

MCP tool `mk_search` passes raw user queries to FTS5 SQL without escaping special characters. Dots in query strings (e.g., `v0.3 queue remaining tasks ship`) cause FTS5ParseError.

**Root cause:** dots are FTS5-reserved syntax; CLI `search.mjs` already sanitizes hyphens and boolean operators (AND/OR) but dots are uncovered.

**Fix:** strip or escape FTS5-special chars before SQL call, or auto-phrase-quote the query. Test with common version strings (`v0.3`, `v0.3.1`) and quoted multi-word queries.

**Why:** production bug affecting search UX when version strings or dotted terms appear in queries

**How to apply:** implement in mk_search handler as part of v0.3.2. Unit tests should include version string queries and edge cases from actual user search logs.
