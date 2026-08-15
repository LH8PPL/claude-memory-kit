---
id: P-NQ7WEWSJ
type: project
title: D-111 Design as Bridge Position
created_at: 2026-06-12T05:53:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4c3a36eacfd8014894d3507bf60e72e20c8002aa
related: [semantic-search-vs-grep-trade-off-d-111-design-rationale, decisions-scope-semantic-fallback-warning-task-156-bug, zero-server-local-first-is-the-kit-s-deliberate-design]
---

D-111 (keyword-first search with semantic strictly opt-in) positions the kit as the bridge between two opposing but both-valid paradigms:
- **PAI stance**: grep-only, no RAG, filesystem-as-context (validated at 15.8k stars)
- **Kit's benchmark finding**: measured paraphrase gap (zero-keyword-overlap recall = 1.000 with embeddings, 0 without)

The design honors both: keyword always works, semantic available when needed.

**Why:** Independent convergence of two respected systems on opposing positions suggests both are contextually correct; the kit's D-111 is the synthesis, not a compromise

**How to apply:** In README or design docs: "grep-first compatible; semantic when you want it" — frame it as the bridge statement between camps, not as "we do both"
