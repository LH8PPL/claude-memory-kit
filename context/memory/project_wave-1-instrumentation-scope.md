---
id: P-U4BAVXA7
type: project
shape: Plan
title: Wave 1 Instrumentation Scope
created_at: 2026-08-01T12:55:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f75266a5bf1281050a8b2f89fa89668bf0e6115e3fa27bb6638cef5d6a9327fc
---

Instrumented operations:
- capture-turn chain (auto-extract spawn + outcome)
- inject-context (snapshot build + lazy-compress spawn)
- precompact worker
- reindex/index-drift detection
- MCP tool errors

Not instrumented:
- cron-side jobs (distill/curate) — have independent logs; extensible later via health.log append

Rationale: focus on ops whose silent failure loses memory; cron jobs lower risk and separately logged

**Why:** Prioritize instrumentation for capture chain (core memory function) in initial phase

**How to apply:** Implement wave 1 covering capture and context-injection failures; plan cron monitoring as phase 2 extension
