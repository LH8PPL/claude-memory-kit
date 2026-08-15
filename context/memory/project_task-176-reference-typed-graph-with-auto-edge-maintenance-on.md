---
id: P-47SKPKG7
type: project
title: Task 176 Reference — Typed Graph with Auto-Edge Maintenance on File Change
created_at: 2026-06-29T12:54:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7963eda2387d905271d903219ce81412febc266ed0ea6858b5e565cb651fbcf3
related: [raptor-hierarchical-summarization-for-multi-hop-reasoning, kiro-cli-vs-kit-activation-pattern-design]
---

pulse8-cortex-vault (Apache-2.0, Python) implements the direct model for Task 176: a typed knowledge graph (NetworkX-based) with automatic edge maintenance as markdown files change.

- Tracks wikilinks, tags, and custom edges in markdown
- Auto-updates the graph when files change
- Queries via `vault_context` (ranked subgraph retrieval)
- Hybrid ranking: BM25 + vector + rerank

Specifically solves the constraint "derive edges from the markdown we already write" — no manual edge declaration needed.

**Why:** Direct reference implementation for Task 176's core requirement (auto-derive edges from markdown changes without explicit schema).

**How to apply:** Review pulse8-cortex-vault's NetworkX sync pattern; add to Task 176's read-list for edge-derivation approach.
