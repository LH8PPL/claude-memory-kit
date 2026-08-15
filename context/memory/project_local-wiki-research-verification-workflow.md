---
id: P-ZB34KHQH
type: project
shape: State
title: local-wiki Research Verification Workflow
created_at: 2026-07-21T11:49:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ca7bf8566bd9b0f0981506cc0b0dbdaeb9a27712dd272f519d55ae1995b1f907
related: [research-verification-workflow-parallel-agents-batch-integra, research-verification-process-uses-paral-zsfnnkgq]
---

User maintains a structured research pipeline:
- Source materials → `/raw/` directory
- Parallel background agents verify sources against 7-point checklists
- Verified notes written to `docs/research/`
- Full integration commit includes: INDEX registration, SOURCES rows, DECISION-LOG entries, task annotations

**Why:** Enables efficient batch verification and maintains audit trail for research credibility

**How to apply:** When processing new research batches, use parallel agents for verification before writing to `docs/research/` and committing integration metadata
