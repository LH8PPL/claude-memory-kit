---
id: P-LGNBM7E5
type: project
title: FTS5 Tokenization Quirk With Version Identifiers
created_at: 2026-07-02T11:54:29Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0c9e7cdcc6f99cf1d3747b86f33df234f816a546a21f17c158be1d18362e23a1
related: [cmk-search-scope-limitation-with-decision-queries, task-planning-laning-workflow, fts5-query-sanitization-task-153]
---

Full-text search (FTS5) tokenizes hyphenated/dotted identifiers like "v0.3.2" into separate tokens, breaking direct token-match queries on version strings

**Why:** Discovered during D-259 design work when building same-subject candidate search by version tokens

**How to apply:** Use quoted phrase queries or explicit MATCH syntax for version/state tokens in FTS5 predicates; note as known limitation in search implementation
