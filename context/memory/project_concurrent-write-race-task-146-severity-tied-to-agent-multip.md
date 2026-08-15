---
id: P-7YE23aRT
type: project
title: Concurrent-Write Race (Task 146) Severity Tied to Agent Multiplicity
created_at: 2026-06-28T20:50:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 63df1801f91a98046b5b8c4a569ac264455b6ff8a5b455b4e9e004d0b3d17790
related: [release-laning-and-task-dependencies-v0-4-4-v0-5, v0-4-x-versioning-roadmap, kit-name-change-task-195-timeline-and-decision-point]
---

**Context:** Task 50 shipped v0.4.0 (Kiro, cross-agent adapter); Task 146 addresses real race in concurrent writes to memory files (lockless file writes → data loss risk).

**Today vs. tomorrow:**
- Today: Single agent (Claude Code) → race theoretical
- When Task 50 agents ship: Multiple writers → race actually bites

**Shipping strategy:** 146 should ship live-tested alongside concurrent-agent work. Version together on release cut (version-on-cut); do not wait for standalone 146 version.

**Why:** Timing of 146 matters for risk/urgency. It's not needed for v0.4.0, but becomes load-bearing as agent count grows.

**How to apply:** When planning agent releases (beyond Claude Code), flag Task 146 for live testing in that release cycle. Don't ship concurrent writers without 146 validated.
