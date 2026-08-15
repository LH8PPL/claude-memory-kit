---
id: P-JHLNTFBM
type: project
title: Node:sqlite Adoption Perf Gate (D-147) — Execution Plan
created_at: 2026-06-13T12:54:42Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5cc1d12832635867cc9514d42705d86768af89a4
related: [141b-is-rejected-decision-rationale, task-141b-node-sqlite-migration-rejected-on-perf, v0-3-2-release-scope-expanded]
---

Before shipping node:sqlite in v0.3.2, run `scripts/bench-storage.mjs` to compare perf against better-sqlite3.

**Test corpus:** recall-bench fixture or dogfood-scale index (hundreds–thousands of facts)

**Hot paths (ranked by user-latency impact):**
- FTS5 keyword query (every `cmk search`)
- sqlite-vec cosine query (every semantic search)
- per-read incremental reindex (runs before every search since Task 110)
- `cmk remember` write (medium priority)
- `reindexFull` bulk insert (low priority)

**Measurement:** p50/p95 per operation, both backends, same machine.

**Acceptance bar:** User sets final threshold; initial proposal ≤10–15% p95 regression on read/search paths.

**Gate teeth:** If node:sqlite fails, v0.3.2 does not ship. Better-sqlite3 + npm-install-size workaround (141a pattern) is the final answer.

**Why:** User won't regress user-facing response latency for installation convenience. Perf is measured, not assumed.

**How to apply:** Before v0.3.2 tag, run the bench script. Gate pass/fail is binary. If fail, close 141b as punted; 141a (npm workaround) is the shipped solution.
