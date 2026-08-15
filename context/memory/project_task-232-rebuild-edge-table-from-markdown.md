---
id: P-9aCLVPGM
type: project
shape: State
title: Task 232 — Rebuild Edge Table from Markdown
created_at: 2026-07-22T16:45:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8e166a9fbcc5cc8ab9fd9e42cf01b9605f895eb068e977ddc8be9ce9aefef4e6
related: [graph-visualization-feedback-edge-density-is-the-limiting-fa]
---

User has independently re-derived need for graph traversal **3 times**. Validated per ADR-0023.

**Current gap:** Kit writes `related:` frontmatter on facts, but edges are not indexed, not returned by `mk_get`, not traversable.

**Approved solution (Task 232):** Rebuild edge table from markdown (zero LLM, rebuild pattern like FTS index). Activates existing `related:` edges, adds supersession chains, enables `cmk links` traversal. Recommendation: pull into v0.6.3 alongside Task 233.

**Why itch keeps surfacing:** Unbuilt task nags precisely because capability is missing — you feel the gap, forget the verdict, re-derive the need.

**Why:** Itch is not stupidity — it's accurate diagnosis of missing visibility. Kit already writes the data; 232 makes it usable. The nagging is the kit's own thesis surfacing.

**How to apply:** When planning v0.6.3, treat Task 232 as the sanctioned answer. Shipping it converts recurring question into capability.
