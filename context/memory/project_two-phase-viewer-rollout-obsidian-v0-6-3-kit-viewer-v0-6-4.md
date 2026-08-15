---
id: P-FD2CJBY3
type: project
shape: Plan
title: 'Two-phase viewer rollout: Obsidian v0.6.3, kit viewer v0.6.4'
created_at: 2026-07-23T08:37:39Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 25948e69960def597ba357e81edcc62180cd61d27e3977de3310e1144a0fe352
related: [task-255-design-grill-questions-queued, ui-viewer-design-awaits-v0-4-scope-decision, cmk-view-purpose-and-headline-use-cases]
---

- Phase 1 (v0.6.3): Obsidian vault integration via Task 254 — near-zero build cost, leverages Obsidian's graph/backlinks
- Phase 2 (v0.6.4): Kit's own viewer via Task 255 — design-first, kit-owned, zero dependencies, renders kit-specific concepts (trust tiers, supersession chains, doctor status, conflict queue, fire-rate collection)
- Context: Task 255 resolves D-121, a six-week parked design question; Obsidian view validates demand before larger v0.6.4 build

**Why:** Cost-benefit sequencing; tests whether users actually engage with memory before custom UI investment.

**How to apply:** Task 254 in-flight on own branch. Task 255 design grill deferred until user initiates.
