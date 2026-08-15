---
id: P-A3E5WU9F
type: project
title: '"Memory-as-Tool" Pattern — External Validation'
created_at: 2026-06-29T11:32:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f1f182ac8ca7732fe5930fca8cf2407b967baf8cc9e7b5104246534e93f53ced
related: [post-retrieval-filtering-query-expansion-hyde, reference-implementation-alignment-strategy, fact-currency-and-auto-supersession-not-yet-implemented]
---

- **Pattern:** Give the agent retrieval as a tool it *chooses* to invoke (judgment-pulled), not auto-injected every turn.
- **Confidence boost:** The ML Mastery article on memory frameworks explicitly contrasts "memory as tool" vs auto-retrieve; frames memory-as-tool as a recognized architectural choice, not a workaround.

**Why:** Our Task 149 "when-to-recall" fork (judgment-pulled vs always-search) is validated by external literature as a deliberate design pattern, suggesting the approach is sound and positions us alongside best practices.

**How to apply:** Task 149: This confirms the judgment-pulled `memory-search` skill as the right architectural lever; continue design in that direction.
