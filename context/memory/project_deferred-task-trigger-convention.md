---
id: P-VKTQFKBR
type: project
title: Deferred Task Trigger Convention
created_at: 2026-07-02T06:15:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 00923dc6c8068ed4f1ee8eef8d5fb7de40d7223cf8a98975001e15b7441739e5
related: [design-md-16-deliberate-parking-lot-with-ship-triggers, gate-verification-system-architecture, task-entry-boundary-definition-specs-tasks-md]
---

Non-blocking tasks are deferred with explicit trigger conditions listed in `specs/tasks.md`:
  - Phase-gated triggers: "after Phase 1 ships", "after 190 ships", "when 191's judgment files exist"
  - User-signal triggers: "user asks ≥2×", "user reports confusion"
  - Event triggers: "next Sonar red", "next security batch", "2nd concurrent-agent host ships"
  - Evaluation gates: "Phase-3 go gate; re-evaluate when Phase 1 ships"

**Why:** Keeps speculative work out of the active board while ensuring deferral is visible, actionable, and not forgotten. Each condition is concrete enough to watch for.

**How to apply:** When deferring a task, assign an explicit trigger (event, user signal, or phase gate). When that condition arises, bump the task to active. When triaging, scan for tasks whose triggers have fired.
