---
id: P-aBK6XaJ4
type: project
shape: Timeless
title: brainapi2 Code-Dive Assessment and Findings
created_at: 2026-07-27T07:24:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e4383614d0a01ddb08fcb0ccb817ae791358bf28ebddc45414c40cd402cf1edd
---

**Headline claim failure**: "Reasoned walkable path, not nearest-neighbour guess" is actually fixed depth-2 vector search with no path-finding algorithms — returns first unordered result.

**Critical structural limitation**: Traversal join requires both hops to share `flow_key` minted per extraction, preventing knowledge connection across documents (exact capability their README advertises).

**Key weaknesses vs our approach**:
- No provenance on graph elements (we carry cites/trust/audit)
- Temporal layer silently broken (date-format mismatch in bare except)
- Zero resumability discipline (their "Janitor" violates standards)

**Borrowable idea** (license-clean, ideas-only): Per-ingest cost accounting printed at extraction boundary — every extraction reports cost at run point (actionable for Task 212 process-health metrics).

**Competitive positioning**: 10 containers, ~22 GB, Neo4j Enterprise, hardcoded cloud model required to deliver unranked two-hop expansion vs our zero-server architecture.

**Why:** Most credible knowledge-graph implementation in the corpus (first with real Neo4j and typed edges). Their failures show where the field is genuinely stuck. Temporal bug is a regression-test gift for Task 66. Positioning insight: high infrastructure complexity for feature parity with simpler approach.

**How to apply:** Annotate Task 212 with cost-accounting pattern, Task 66 with recency-variance regression test (catch silent date-parse failures). Add SOURCES entry and decision-log note. Defer filing until Task 257 (BOM fix) completes.
