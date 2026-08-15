---
id: P-2CXY4aaE
type: project
shape: Timeless
title: Memory Kit Validates Itself as Dogfood Test Subject
created_at: 2026-07-23T09:38:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: de0107c4bb7c63268f866512184c08253724b56839ac3bf882f020f9f8ed3e51
related: [skill-review-imported-facts-staleness-bug-fixed, kit-dogfooding-the-arc-that-redefined-memory-capture-was-its, claude-memory-kit-captures-dogfood-facts-about-its-own-debug]
---

The claude-memory-kit repository maintains its own `context/` memory system as a working demonstration. The first `MAP.md` commit in the dogfood repo proves the system renders and links correctly end-to-end.

**Why:** The kit's own memory is not just documentation—it's active validation that the system works.

**How to apply:** When developing memory features, treat the kit's own memory state as the primary test. Validate new changes against how they affect the kit's own fact rendering and wikilink graph.
