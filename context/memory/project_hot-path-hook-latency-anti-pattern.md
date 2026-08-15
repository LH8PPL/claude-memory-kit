---
id: P-M4AMN9GC
type: project
shape: Timeless
title: Hot-Path Hook Latency Anti-Pattern
created_at: 2026-07-22T19:20:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3f4e754177a8178c0e7818b311116faacd29a0516f155b36ee775018cea78e35
related: [claude-md-checkpoint-4-pre-commit-screening-rule]
---

The repo has been burned by hook latency composition in hot paths six prior times. Hooks invoked on the critical path (like the FTS5 hint lookup before every prompt) become a measurable bottleneck.

**Why:** Hooks can add significant latency. When called synchronously on high-frequency paths, they compound—not just in aggregate, but in tail latencies and p99 impact.

**How to apply:** Audit any hook calls proposed for hot paths in Task 233 (e.g., hint retrieval). Measure empirically. Prefer batching, deferral, or elimination over synchronous hook invocation on critical paths. If hooks are unavoidable, set latency budgets and alarms.
