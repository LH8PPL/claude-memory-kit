---
id: P-NXF3aCPB
type: project
title: Semantic Search vs. Grep Trade-Off (D-111 Design Rationale)
created_at: 2026-06-12T05:47:58Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 97e0ad03fdfa938d68507230298c53b9f3120202
related: [d-111-design-as-bridge-position, task-141b-node-sqlite-migration-rejected-in-d-162, decisions-scope-semantic-fallback-warning-task-156-bug]
---

The kit uses optional semantic search (D-111: semantic available, keyword always works). PAI deliberately avoids vector search, relies solely on grep.

Both are correct for their context:
- PAI: author greps their own writing in their own vocabulary; semantic adds little
- The kit: benchmarked and found zero-keyword-overlap queries recover at recall=1.000 with embeddings, 0 without — semantic solves a real paraphrase gap

The kit's D-111 design honors both philosophies: semantic available as opt-in, grep always works as mandatory tier.

**Why:** The kit's semantic-search choice diverges from PAI despite shared philosophy. The decision is data-driven (benchmarked) and intentional, not a paradigm violation. Documents why the choice was made for future reconsideration.

**How to apply:** Reference this when reviewing or defending the semantic-search feature. The trade-off is explicit and measured; the decision is reversible but well-founded.
