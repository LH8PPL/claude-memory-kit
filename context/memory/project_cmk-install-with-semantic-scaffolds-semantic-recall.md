---
id: P-WaCZ7REY
type: project
title: cmk install --with-semantic Scaffolds Semantic Recall
created_at: 2026-06-14T11:11:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 82e47a869aa243cd5c3c139c19da7129fd8b37bb3d0106d5328c2785c1bbf098
related: [cmk-install-scaffolding-and-wiring, cut-gate11-pre-session-verification-checklist, verification-sequence-for-task-169-170-fresh-folder-gate]
---

`cmk install --with-semantic` scaffolds:
- `context/` as memory root
- `.claude/settings.json` with hooks registered (verified by `cmk doctor` HC-1)
- Semantic recall enabled (hybrid search mode default; embeddings pre-cached ~7s)
- npm dependencies (~25 added, 49 changed, including better-sqlite3 + embedder)

**Why:** Semantic search adds hybrid matching (keyword + semantic) to memory recall, improving relevance of facts retrieved across sessions.

**How to apply:** After `cmk install --with-semantic`, `cmk search` defaults to hybrid mode. Run `cmk doctor` to verify (expect 5 pass · 0 fail · 3 skip in a fresh project).
