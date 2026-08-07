---
id: P-L3EGQURX
aliases: [P-L3EGQURX]
type: project
shape: State
title: Co-occurrence Edge Layer Rider for Task 262
created_at: 2026-08-07T19:07:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 077fcd9f5e7468aa5c6ca5c22598f6eea2a456f495563357e52d7b6f70fa3bcb
---

Add toggleable co-occurrence edge visualization to the memory viewer. Edges computed at render-time (zero storage), drawn between facts that share ≥1 type or topic tag. Implementation ~1 day. Addresses the "4% linked = looks empty" perception while Task 262 pursues semantically meaningful stored links. Client-side rendering means the layer is cheap and composable.

**Why:** mnemory's dense graph is a visual artifact of coarse category tagging; cmk's sparse stored links are semantically richer but look empty to users. This rider improves UX perception without compromising link quality.

**How to apply:** Scope as optional enhancement rider with Task 262 work. Prioritize 262's stored link quality; treat this as UX polish, not core functionality.
