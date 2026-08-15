---
id: P-N4JDFHPV
type: project
shape: Timeless
title: Workflow Green ≠ Release Commit Checks Green
created_at: 2026-07-20T20:58:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0da6f84af3e138585ff0349432f18ce29ea70829d5cd7884b83e643cfde4ab04
related: [verify-check-run-agent-liveness-before-status-reports, workflow-green-commit-green, sonarcloud-quality-gate-posts-as-github-check-runs-not-workf]
---

A GitHub workflow run showing green status does not imply that all checks on a specific release commit are passing. During v0.6.1, the workflow was green but at least one individual check on the commit remained red. Never infer commit-level check status from workflow status.

**Why:** This divergence broke release confidence and caused a second verification pass. Workflow runs aggregate multiple check types; one check failure can be invisible at the workflow level.

**How to apply:** For release commits, query commit-specific check status directly (via GitHub API or UI) rather than inferring from workflow status. Verify "14/14 checks green on commit <hash>", not "workflow green."
