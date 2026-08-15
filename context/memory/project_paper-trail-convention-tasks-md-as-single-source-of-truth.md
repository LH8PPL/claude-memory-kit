---
id: P-46TWC2C2
type: project
shape: Relationship
title: 'Paper Trail Convention: Tasks.md as Single Source of Truth'
created_at: 2026-07-05T13:47:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6b3138695fdbc068637c5071f2d75b0f998bd31de024b6f5ec208f5dfcbfca3a
related: [documentation-map-spine-drifts-while-decision-log-stays-curr, canonical-agent-support-list, design-contract-enforcement-via-tests-code]
---

The project maintains a "paper trail" consisting of three synchronized components:
- **DECISION-LOG**: Records decisions (e.g., D-270, D-271) and rationale.
- **tasks.md**: The authoritative task status file; must always reflect actual code state and decision-log decisions.
- **RELEASE-PLAN**: Tracks blocked releases (e.g., v0.4.5 blocked on Task 200).

Drift occurs when tasks.md lags behind the decision log or actual code state. This session: tasks.md hadn't been updated to reflect that the recursion guard and KiroCliBackend were done, or the D-271 deep-research gate. Now fixed.

**Why:** The project relies on tasks.md as the canonical reference for task status; stale entries break the single-source-of-truth principle and risk decisions being missed or contradicted.

**How to apply:** After any major decision, code completion, or blocker, update the corresponding task entry in tasks.md to match the current state. Before moving forward, verify tasks.md reflects the decision log and actual work state.
