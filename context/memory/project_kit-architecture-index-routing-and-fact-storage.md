---
id: P-E3SWXCSY
type: project
title: Kit Architecture — Index Routing and Fact Storage
created_at: 2026-06-12T06:01:06Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 54c0f5f3497abfb2513972aef5bca6eae24c5ad3
related: [task-boundary-memory-flush-rule, test-repo-1455-facts-activated-semantic-mode-today, memory-tiers-contain-only-mission-context]
---

- MEMORY.md serves as a bounded, actively-loaded index artifact (capped size, hot in session context)
- Fact files (unbounded size) store detailed content, routed via MEMORY.md reference
- INDEX.md or similar metadata preserves causality chains — supersede relationships, historical edges between facts
- This design unifies efficient retrieval (hot index) with large-scale persistence (fact files) without forcing tradeoffs

**Why:** The pattern scales to large corpora while keeping session context tractable. Multiple independent research efforts converged on this design, validating the approach.

**How to apply:** When extending or refactoring memory system, treat MEMORY.md as routing surface, fact files as content store, and INDEX.md as the causality record. Preserve this separation to maintain both performance and debuggability.
