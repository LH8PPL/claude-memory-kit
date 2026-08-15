---
id: P-YFS9URVA
type: project
shape: State
title: v0.6.2 Release Staging & Task 248 Timing Decision
created_at: 2026-07-22T10:53:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 35f1474104add009bb35f7d440d1062a1ae65aa49bea8481852160959c38356a
related: [v0-6-2-release-approved-before-auto-recovery, npm-registry-instability-and-v0-6-4-workflow-hardening, version-cut-workflow-pattern]
---

v0.6.2 is staged at commit `b4bf558`, ready to tag. Task 248 (orphaned-tier auto-recovery) timing decision pending:
- **Option A:** hold tag, build recovery into v0.6.2 → users upgrading from buggy versions get automatic cleanup in single step
- **Option B:** tag v0.6.2 now as-is, implement recovery in v0.6.3 → users need two upgrade steps

**Why:** v0.6.2 is the release target users upgrade TO from buggy versions; recovery in v0.6.2 is ideal UX but requires un-staging and rebuilding

**How to apply:** user owns this decision; next session should know this decision point is open and what each path costs
