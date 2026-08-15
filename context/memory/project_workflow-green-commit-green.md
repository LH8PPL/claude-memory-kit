---
id: P-SYX763T5
type: project
shape: Timeless
title: Workflow Green ≠ Commit Green
created_at: 2026-07-20T20:31:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c8baa0744d0052cab1d29973baf3764a3406ef5712cd58838d2c2f5a00e129a7
related: [ci-watch-rule-specify-ci-yml-by-name, sonarcloud-quality-gate-posts-as-github-check-runs-not-workf, workflow-green-release-commit-checks-green]
---

A passing CI/CD workflow does NOT guarantee a passing commit. Documented in CLAUDE.md sub-rule (d). Check-runs enumerate the true commit status; workflows can pass while checks fail.

**Why:** Prevents false confidence in build/deploy readiness; assistant initially relied on workflows and missed commit-level failures.

**How to apply:** When verifying pass/fail on a branch, explicitly enumerate check-runs. Don't assume workflow green = commit green.
