---
id: P-7NUMKYFH
type: project
title: Post-Retrieval Filtering & Query Expansion (HyDE)
created_at: 2026-06-29T11:32:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f1ff59c6cc36ade4d5aa7df84a7b8a2517e583dfaf8fffb5efc93a7047ab3d6f
related: [memory-as-tool-pattern-external-validation, rrf-configuration-fusion-strategy, closed-products-recall-architecture-validation]
---

- **Post-retrieval filtering:** Re-score all retrieved candidates against the *immediate task context* before injection; drop low-scoring docs. "Significantly improves output quality" vs retrieve-and-inject-all pattern.
- **Query expansion (HyDE):** Generate a hypothetical answer to the user query, embed that synthetic text, and search with it — bridges paraphrase gap between how users ask and how facts are stored.
- Both are missing from current recall pipeline; both are actionable for Task 178 (recall quality) and Task 149 (when-to-recall judgment).

**Why:** The ML Mastery articles on context-aware search and effective context engineering document real techniques that directly address the paraphrase-recall problem (Task 65/99 already measures this gap).

**How to apply:** Task 178: Add post-filter layer + HyDE variant to benchmark. Task 149: Consider HyDE as a retrieval-quality lever for judgment-pulled recall.
