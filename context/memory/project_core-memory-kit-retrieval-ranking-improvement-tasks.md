---
id: P-PLUGLQQR
aliases: [P-PLUGLQQR]
type: project
shape: State
title: Core-Memory-Kit Retrieval/Ranking Improvement Tasks
created_at: 2026-08-15T08:20:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: df10c81d2b2cac6a860d51ad32dcaa4a33372a321e392ece3ac013662b7248c4
---

Project has active task lanes targeting retrieval and ranking improvements:

- **Task 278**: Query-expansion module effectiveness vs. keyword-floor baseline
- **D-360**: Reranker evaluation — which rerankers provide measurable value
- **RRF fusion variants**: Comparison of different fusion approaches vs. current RRF
- **QA-pair auto-generation**: Automated fixture generation from corpus (currently hand-crafted)

These tasks directly inform external tool evaluation; AutoRAG research should focus on implementations/benchmarks relevant to these areas.

**Why:** Mapping external findings to these specific bottlenecks informs trade-off decisions and task prioritization.

**How to apply:** When evaluating external repos, cross-reference their implementations and measurements against these four areas. File new tasks if findings suggest novel, measured improvements.
