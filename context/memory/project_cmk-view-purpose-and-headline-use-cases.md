---
id: P-ARCDSP99
type: project
shape: State
title: cmk view purpose and headline use cases
created_at: 2026-08-02T08:27:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4ec690e510d2c78764188ffbd6560e3893d8f60a67f9cd14c869380690dbc21a
related: [cmk-view-integrates-with-core-memory-subsystems, doctor-is-reactive-only-memory-write-search-are-automatic, q3-wave-1-viewer-five-views-locked]
---

`cmk view` answers four questions that generic tools (e.g., Obsidian) cannot:
1. "What does my AI remember about this project?" — browse and search facts with full-text search
2. "Is it right?" — see trust tier, session origin, supersession chains, conflict queue
3. "Is it working?" — consolidated health view (doctor status, health-log warnings, fire-rate telemetry)
4. "How is it connected?" — graph with kit semantics (trust as color, supersession as direction)

Competitive position: hermes-agent has no memory viewer; claude-mem's viewer is its most-loved surface. This is v0.6.4's headline differentiator.

**Why:** Solidified in decision D-397 after June stub removal (D-121) and July Obsidian observation ("not the wow I thought it would be"). The memory system is invisible without a viewer that understands kit semantics, not generic note tools.

**How to apply:** These four use cases define the viewer's scope. When evaluating features or design decisions, prioritize these purposes. Helps explain why the viewer is not optional for v0.6.4.
