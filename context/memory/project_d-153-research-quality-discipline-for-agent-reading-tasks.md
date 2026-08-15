---
id: P-ESHZTR53
type: project
shape: Timeless
title: D-153 Research Quality Discipline for Agent Reading Tasks
created_at: 2026-07-21T07:51:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d2c91be98a6e4e0285e6761ba936633b1575e393f44fbaeb7dd22f57007e4b13
related: [d-364-discipline-for-external-source-claims, multi-step-research-ingestion-integration-workflow]
---

Agents applying D-153 discipline to source reading:
- Separate explicit, traceable claims (metrics, direct quotes) from author interpretation or speculation
- Attempt to verify key claims against primary/authoritative sources
- Report verification failures honestly (HTTP errors, unreachable links, inaccessible content) rather than omitting them
- Flag which findings came from the original source vs. the reading agent's inference
- Note intermediate/supporting claims that secondary sources revealed (e.g., intermediate percentages the primary article missed)

**Why:** Research workflow requires notes that clearly distinguish source-backed facts from interpretation. Downstream synthesis tasks depend on knowing what can be cited to the original author and what is agent inference.

**How to apply:** When spot-checking completed research notes, verify they follow D-153 discipline. When briefing agents on a research task, communicate this standard explicitly.
