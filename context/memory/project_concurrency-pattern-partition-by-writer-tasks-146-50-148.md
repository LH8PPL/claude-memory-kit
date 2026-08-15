---
id: P-32Q5YHHV
type: project
title: Concurrency Pattern — Partition-by-Writer (Tasks 146/50/148)
created_at: 2026-06-29T12:54:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 77a1e7f4af96e0a9b6f5be6efd9abc33449289f66304b6c71dd4ed66da6dd761
related: [prior-research-outputs-d-218-and-d-227]
---

nestwork solves multi-agent concurrency via **partition-by-writer**: each agent owns its own directory tree, eliminating write collisions without locks or CRDTs.

- AGENTS.md serves as canonical source with thin mirrors in agent-owned dirs
- Desensitization contract at write time (agent respects its partition boundary)
- No merge conflicts; no coordination overhead

**Why:** Directly applicable to multi-agent scenarios (Tasks 146/50/148). Avoids distributed-systems complexity by enforcing ownership-based write safety.

**How to apply:** Reference nestwork's agent-directory structure and AGENTS.md-mirror pattern for multi-agent write isolation.
