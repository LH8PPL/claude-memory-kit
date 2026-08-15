---
id: P-LT3J2JJU
type: project
title: 'Research Cycle Workflow: Enumerate → Triage → Deep-Read → Synthesize'
created_at: 2026-07-01T21:13:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5b09ce25c4e81c84c43df7d0471096df5f3287c8145714296c61003e99410ecc
related: [raw-research-evidence-preservation-vs-synthesis-only-boundar, verify-then-spend-methodology-this-project, kit-dogfooding-the-arc-that-redefined-memory-capture-was-its]
---

The 2026-07-01 arc followed a repeatable research pattern:
- **Enumerate:** ~79 systems identified across the comparative-judgment domain
- **Triage:** filtered by relevance to design questions
- **Wave-1 deep-reads:** 9 systems analyzed in detail
- **Wave-2 deep-reads:** 18 systems added for coverage
- **Synthesize:** findings merged into comparative-judgment and full-field notes

This pattern was driven by reusable research harnesses (workflow scripts). Development cost: ~4M tokens. Re-run cost: cheap.

**Why:** Research cycles are fundamental to this project's evolution (the kit improves by studying other systems). The harness is not a one-shot artifact; it's infrastructure for future cycles.

**How to apply:** Archive research harnesses (e.g., `tools/research/harnesses/`) so they're available when the next research cycle runs. Treat the harness as project infrastructure, not session artifact.
