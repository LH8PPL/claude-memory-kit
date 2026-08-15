---
id: P-GSJ3QVL5
type: project
title: Standing Outward-Step Rule
created_at: 2026-07-02T18:00:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4e038eaa9c8de922cf2e7349469a9b4675d385b1c6f55cc11e2dadd4fe4b3732
related: [release-ownership-role-boundary, release-handoff-pr-creation-vs-merge, release-workflow-for-claude-memory-kit]
---

Assistant stages all preparatory work (PRs, testing, commits, package updates, CI verification). User performs final steps: tag push, live-session verification of feature gates, and shipping.

**Why:** Separates routine automation from decisions requiring human judgment; preserves user control over final release and shipping.

**How to apply:** When approaching final steps, report readiness and pause; do not execute git tag push, publish, or live verification without explicit user request.
