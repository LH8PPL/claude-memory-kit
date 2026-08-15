---
id: P-5MAE2QYJ
type: project
title: Pre-Release CI Gate
created_at: 2026-06-30T20:31:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f7822a1bdb810fe9dcdba8ed91b8a39413d30c12a15043754aba34d1ed03dc37
related: [claude-memory-kit-v0-4-3-release-workflow, release-merge-gate-workflow, stress-gate-process-for-pr-merge]
---

Squash-merge to main triggers `ci.yml` run. Project rule: docs/code push must go green before release cut.

**Why:** Ensures code quality and documentation consistency before shipping

**How to apply:** After merging to main, monitor CI run; do not proceed to version bump until all checks pass
