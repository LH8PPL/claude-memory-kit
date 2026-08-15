---
id: P-7EQa5V6Z
type: project
title: RAPTOR — Hierarchical Summarization for Multi-Hop Reasoning
created_at: 2026-06-29T11:32:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f887b9e502ea263b3c4752f3ca6b519fe924eca3702319b7f6c247203d7893bd
related: [task-176-reference-typed-graph-with-auto-edge-maintenance-on]
---

- **Pattern:** Recursive clustering → summarize clusters → cluster the summaries → repeat, building a hierarchical tree of summaries from leaves (raw docs) to root (global summary).
- **Use case:** Bridges multi-hop reasoning without requiring explicit graph edges; works with unstructured text + hierarchical structure inference.
- Maps to Task 176 (graph-based retrieval); introduces a new technique complementing edge-derivation and dedup-ladder patterns.

**Why:** The "beyond vector search" ML Mastery article names the 5 next-gen RAG strategies; RAPTOR is the one genuinely new to our research (others — GraphRAG, ColBERT, HyDE, Agentic RAG — already appear in our task list).

**How to apply:** Task 176: Add one-line note on RAPTOR as a hierarchical-summary alternative to explicit graph structures; consider as a read-list addition alongside Cognee deep-dive.
