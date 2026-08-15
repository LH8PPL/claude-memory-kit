---
id: P-MSZXZ6VS
type: project
title: Project Origin and Core Problem
created_at: 2026-06-19T21:49:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e0e3c314807be3f39379f412ab711424e11e1bc92985afd036844b39631d0e48
related: [core-memory-kit-dogfoods-its-own-memory-system, memory-system-dogfooding-internal-use-as-test-case, design-reference-awrshift-claude-memory-kit]
---

claude-memory-kit was created to solve the core problem: **Claude Code forgetting all the time**. The entire project was directly inspired by a video on hybrid memory architecture for multi-project/client work.

**Why:** This origin story is the foundation of all design decisions and prioritization. The kit exists to solve the user's real problem (forgetting context across sessions), not for its own sake. The video's thesis (recall reliability is the most important layer) validates why injection-layer quality is core product value.

**How to apply:** Reference the core problem (Claude Code forgetting) when evaluating features or re-prioritizing work. This grounds decisions: Task 151's importance, the down-payment fix prioritization (v0.3.5), and why injection-layer reliability trumps curation polish.
