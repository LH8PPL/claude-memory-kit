---
id: P-4TT7GZYA
type: project
shape: Timeless
title: Research Task Workflow Pattern
created_at: 2026-07-19T19:59:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0a5b6f0828eef32304b15cb5f3902ff52b9ae9975439c570675eabd14912d82e
related: [project-decision-trail-lane-preservation-habit, post-fix-integration-workflow, feature-branch-reviewer-merge-hold-workflow]
---

Research tasks (verdict-bearing work) follow this sequence:
- Research note: findings captured
- ADR: decision record
- Verdict: ADOPT/REJECT/KEEP-CURRENT decision
- One PR per task: each verdict flips to a dedicated PR (e.g., #306 for Task 178)

**Why:** Established integration pattern ensuring research findings flow through clear decision points before merge

**How to apply:** When executing research tasks, structure output and integrate following this pattern
