---
id: P-EJaVPBA9
type: project
shape: Timeless
title: SonarCloud Quality Gate Posts as GitHub Check Runs, Not Workflows
created_at: 2026-07-20T19:41:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: befd17170c1a9a13a69022a7a648326920e1e6b5c725e467c5d6a68671017754
related: [workflow-green-commit-green, claude-memory-kit-v0-4-3-release-workflow, workflow-green-release-commit-checks-green]
---

- SonarCloud Quality Gate pass/fail results post as GitHub check runs, not Actions workflow status
- The `gh run list` command shows the analysis job status (uploaded = success) but does not surface the gate result
- This caused a disconnect where the workflow appeared green while the gate actually failed
- **Process fix:** After pushing to main, enumerate the commit's check runs and filter to non-success status; empty output means all checks (including SonarCloud) passed
- Workflow status alone is insufficient for verifying CI green on a commit

**Why:** This session missed a SonarCloud Quality Gate failure while relying on workflow status alone

**How to apply:** When verifying main branch CI status, always enumerate check runs to filter non-success, not just checking workflow runs
