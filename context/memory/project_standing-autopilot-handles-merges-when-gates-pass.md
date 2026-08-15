---
id: P-CXJVGGaR
type: project
shape: Preference
title: Standing Autopilot Handles Merges When Gates Pass
created_at: 2026-07-21T18:33:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c9cc4b381154e9dc112fa4366fff9235ddaea9dda408096abdfe00888c79b5ce
related: [5-concurrency-stress-gate-as-pre-pr-verification, multi-layer-gating-before-main-merge, release-workflow-sequence]
---

Once both PR gates (CI + skill-review) pass clean and all check-runs are enumerated and green, merge is automatic under "standing autopilot." No manual merge action required.

**Why:** Reduces toil in the final merge step; keeps PR workflow smooth and predictable.

**How to apply:** When a core-memory-kit PR reaches this state (all gates green), expect automatic merge. No reviewer action required to trigger it.
