---
id: P-UV955AFU
type: project
shape: State
title: Stress Gate Process for PR Merge
created_at: 2026-07-13T15:22:32Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0d103f0e9aafdf21ec2b12f9429ed43c0bc10bda68f66b27dbf519a2a305b738
related: [vitest-pool-corruption-transient-load-failures, no-disclaimed-flakes-rule, release-workflow-cold-open-testing-discipline]
---

Before opening a PR, run the full test suite 5 times in succession. All 5 runs must pass to merge. Any failure requires investigation per the no-disclaimed-flakes rule; do not merge without root-causing the failure.

**Why:** Catches intermittent/flaky test failures before they enter main branch; prevents false-passing PRs from degrading branch reliability.

**How to apply:** When preparing to open/merge a PR, run the full suite 5×. Monitor all runs. Only proceed if all 5 pass. If any fail, investigate the root cause before merging.
