---
id: P-6NWQ6U9M
type: project
title: Verify-Then-Spend Methodology (this project)
created_at: 2026-07-01T20:17:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d3089c66bba5e523ec654b6ca1eeaf34173835e585ce8231a14102b577a98606
related: [research-cycle-workflow-enumerate-triage-deep-read-synthesiz, full-gate-re-run-on-final-code-after-code-review, vitest-can-show-a-module-resolution-failure-cannot-find-modu]
---

Before launching expensive multi-agent runs (e.g., Wave-2 with 10+ agents):
1. Do a cheap/narrow verification pass to identify hallucinated or duplicate systems
2. Then run the expensive full pass only on confirmed-real targets

This is *not* cost-saving; it's quality-saving. Filtering bad targets "makes the re-run sharper, not smaller" by avoiding wasted deep-reads on invalid systems.

**Why:** Expensive runs can burn budget fast (e.g., 36 agents last instance). Filtering up-front prevents re-runs and improves signal.

**How to apply:** Always verify targets before expensive multi-agent tasks. The cheap pass catches hallucinations; the expensive pass runs only on confirmed targets.
