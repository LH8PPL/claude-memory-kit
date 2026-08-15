---
id: P-a2QWV6V4
type: project
title: Decisions Scope Uses Direct File Read, Not Vector DB
created_at: 2026-06-18T18:22:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 54b81b8e1e1fdfa6e6090d69e111de0c189c0bbe0d4be67d4b7b401efd159b20
related: [f-7-spec-vs-code-mismatch-tombstone-reading-in-cmk-get, decisions-scope-semantic-fallback-warning-task-156-bug, modular-skill-architecture-read-write-separation]
---

The `decisions` scope in search reads `context/DECISIONS.md` directly as a markdown file, NOT from the indexed vector DB (`vec_observations`, `vec_transcripts`). The journal is a derived markdown view, not a DB table, and is NOT indexed by `cmk reindex`. Therefore, semantic search is impossible for this scope — there is nothing to embed in the vector store.

**Why:** Task 156 established this design to reuse the file-read precedent and maintain the journal as a live markdown view. Semantic search requires indexed data; the journal is neither indexed nor stored as table rows.

**How to apply:** When designing or debugging the decisions scope, remember it is keyword-only by design. Do not attempt to add semantic support — the journal cannot be indexed and embedded. Keyword-scan-the-file is the correct and only mechanism.
