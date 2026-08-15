---
id: P-76aPFZKX
type: project
shape: Plan
title: v0.6.3 Lane Execution Sequence — Next Session Start
created_at: 2026-07-22T14:06:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cfd7dd3a3f1f6723e122dd14b52f62b2438eeb5a3730102b46ab7a3e40a6b2bc
related: [v0-6-3-lane-pr-composition-and-release-purposes, post-fix-integration-workflow, v0-6-2-release-approved-before-auto-recovery]
---

- **First**: PR 233 (recall hint + fire telemetry)
- **Note**: PR 248 (install-flow auto-recover) requires a fresh session because it touches the install path
- **Then**: PR 250 and riders (247/249) as grill-gated

**Why:** 233 is foundational; 248 needs clean state to avoid interaction with prior work; sequence ensures install-flow safety

**How to apply:** When next session begins v0.6.3 lane work, start with 233, flag 248 for fresh-session treatment
