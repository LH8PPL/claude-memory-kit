---
id: P-7W4CWPSD
type: project
title: 'Release Handoff: PR Creation vs. Merge'
created_at: 2026-07-01T10:52:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 359951f02378ed8edd499b278c406c0e9af276c7b35ba0ab9d7b07d3ad81ae6f
related: [release-trigger-tag-push-publishes, v0-5-1-release-pr-282-must-merge-before-tag, feature-branch-reviewer-merge-hold-workflow]
---

The project's release protocol: assistant creates the PR, user performs merge + tag + push. Assistant asks for approval before creating the PR.

**Why:** User retains final control over what ships to production.

**How to apply:** When a task is ready to ship, assistant creates the PR; user does the merge/tag/push ("outward steps").
