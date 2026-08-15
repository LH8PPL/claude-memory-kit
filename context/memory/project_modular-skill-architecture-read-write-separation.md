---
id: P-2aD2YHMB
type: project
title: 'Modular Skill Architecture: Read/Write Separation'
created_at: 2026-06-13T02:23:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bbca981883bdb5d667dcebec84fd8f58cd9e4843
related: [kit-skills-are-modular-thin-orchestrators-over-a-deep-cmk-su, decisions-scope-uses-direct-file-read-not-vector-db, cmk-view-task-255-architecture-and-constraints]
---

The kit's two core skills are deliberately separated by capability boundary:

- `memory-search` — read-only (allowed-tools: search/get/timeline/recent only), context: fork, returns summary only
- `memory-write` — write-only (safe-write path: remember/forget/trust), never reads

This separation is intentional and foundational: a read-only recall skill that cannot mutate memory is the safety inverse of a write-only capture skill. Each loads only its own context; skill bodies do not front-load context (progressive disclosure — bodies load on demand).

**Why:** Separating read from write reduces blast radius and prevents accidental memory corruption. The boundary is a first-class design principle, not an implementation detail.

**How to apply:** When designing or extending skills, preserve this boundary. Do not merge read and write capabilities. Progressive disclosure means skill bodies should be lazy and load context on demand, not front-load it.
