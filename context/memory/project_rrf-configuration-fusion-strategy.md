---
id: P-E3UELCGM
type: project
title: RRF Configuration & Fusion Strategy
created_at: 2026-06-29T11:32:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2c20c5691daf897a4b86ba3dbafbcb724eb60a43d83875642e08a2f6811c77c1
related: [post-retrieval-filtering-query-expansion-hyde]
---

- **RRF constant:** `k=60` is the standard academic/implementation default (not a free parameter to tune in isolation)
- **Retrieval order:** Retrieve all documents from *both* engines before applying RRF fusion, not top-k from each separately — truncating before fusion introduces "truncation bias favoring whichever ranker runs first"
- These are concrete implementation specifics for Task 178 (hybrid-search benchmark)

**Why:** The ML Mastery hybrid-search tutorial encodes real implementation details that avoid subtle correctness bugs.

**How to apply:** When 178 builds the RRF benchmark, use `k=60` as the default and retrieve-all-before-fusing as the baseline fusion pattern.
