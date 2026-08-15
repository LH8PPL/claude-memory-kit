---
id: P-WAXZ3EEX
type: project
shape: Preference
title: Flush Memory to Main Before Creating Feature Branch
created_at: 2026-07-22T17:52:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e3b7eae24ab72fd1bfa5d9454a1671adf0ea619ab9c3d471dc086f09e84a3925
related: [dogfood-decisions-md-committed-post-merge-not-with-feature-p, post-fix-integration-workflow, memory-review-discipline-before-commit]
---

When preparing a multi-part feature task, flush accumulated memory to main *before* creating the feature branch. This keeps the feature branch code-only and prevents memory updates from cluttering the PR diff.

**Why:** Feature PRs should reflect code changes only; memory updates are orthogonal and complicate review clarity. Separating them improves PR signal-to-noise.

**How to apply:** End prep work (scouting, planning, documenting findings), push memory to main. Then create the feature branch. During implementation, any interim findings are recorded post-session or committed after PR merge, not during the branch.
