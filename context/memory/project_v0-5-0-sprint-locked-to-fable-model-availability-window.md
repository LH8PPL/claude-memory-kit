---
id: P-DQYYXF7X
type: project
shape: Plan
title: v0.5.0 Sprint Locked to Fable Model Availability Window
created_at: 2026-07-06T19:47:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9dd144b6e31909b44f1756668adc7de6924f8aee8f460b0e6987d1cd25433ebf
related: [task-165a-is-design-decision-linked-to-d-285-not-mechanical, consult-the-user-before-shipping-a-fix-mid-live-diagnosis, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes]
---

User has reprioritized to ship v0.5.0 immediately after v0.4.5 (already live). Reason: Fable model is required for v0.5.0 work and will not be available after midnight UTC (~1.5 hours from 2026-07-06 19:33 UTC, i.e., before 2026-07-06 21:00 UTC).

Design decisions deferred to post-v0.5.0 sprints:
- D-285 (global default optionality)
- 165a (MCP prompt refinement)

Current blocker: PR #259 code review (once merged, Task 193 feedback-screen starts).

**Why:** Hard external constraint (Fable availability) drives sprint scope and prioritization. Deferring lower-priority design work keeps team on critical path to capture the feature window before model access expires.

**How to apply:** Next session: ship v0.5.0 without design distractions. If Fable is unavailable, pivot to deferred design work (D-285, 165a) or backlog. Do not propose design explorations until v0.5.0 is shipped.
