---
id: P-5VGPMEJN
type: project
shape: Absence
title: Stress Tests Require Git Isolation (Task-150 EPERM Race)
created_at: 2026-07-08T16:48:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d4140b04995214c076b0bc284aceea4cbdaffe56ded31a04d6b98253b7854e08
related: [stress-gate-release-workflow, stress-tests-skipped-for-pure-file-mutation-in-process-ops, windows-eperm-in-test-150-cleanup-diagnosed-fixed]
---

Running `git` commands while stress tests are in flight causes an EPERM race condition (Task-150). Workaround: stay off git until stress test suite completes.

**Why:** Prior incident: parallel git + stress caused file lock races, breaking reproducibility.

**How to apply:** When running stress tests, avoid all git operations in parallel. Wait for stress to complete and report before committing or other git actions.
