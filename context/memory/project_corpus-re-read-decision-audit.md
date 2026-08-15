---
id: P-JDP4JQ5P
type: project
title: Corpus Re-Read Decision Audit
created_at: 2026-07-01T21:11:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1569a5928089ff4f51a3eced10968b6b9fca11649f0422ccb036f8c725216b2d
related: [adr-0017-finalization-agenda]
---

Before finalizing a complex decision spanning multiple research artifacts, prior ADRs, and filed tasks, conduct a dedicated full-corpus re-read audit:
- Read all artifacts as one coherent system, not sequentially
- Extract findings in four categories: staleness markers, unexamined gaps, implicit master variables, differentiator refinements
- Use findings to sequence the decide-step actions (finalization → patching → execution)

This catches system-level insights invisible to single-artifact review. In this session: stale ADR, unscreened feedback path, recurrence-as-fuel (implicit across five artifacts), honesty-as-differentiator (only visible in comparative 47-system + 10-system frame).

**Why:** Multi-artifact projects hide insights at the intersections. The audit is replicable and produces actionable fix-lists and sequencing.

**How to apply:** Schedule as a pre-finalization discipline. Extract findings by category, then use them to refine ADRs, patch maps, and assign task order.
