---
id: P-7D37FCUX
type: project
shape: State
title: Regression Test Pinning on Bug Fixes
created_at: 2026-07-06T21:24:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bd35fd0e06f8a01d7f1542308611d65f48c5c66b2f15dc33993ae6922ef2fa0a
related: [data-loss-bug-pattern-echo-rm-laundering, skill-review-imported-facts-staleness-bug-fixed, sonarcloud-coverage-job-rate-limited-by-hf-hub-cache-miss]
---

When bugs are identified and fixed (especially critical ones), regression tests are written and committed alongside the fix to prevent reoccurrence.

Example: #191 fixes included the replication-inflation vulnerability above; the fix was paired with a regression test that catches the specific failure mode (`n_episodes` double-resolution).

**Why:** Regression tests ensure the same bug does not silently return as code evolves. Critical invariant bugs are particularly important to pin because they are easy to reintroduce and hard to detect in production use.

**How to apply:** When reviewing or developing a bug fix, confirm a regression test has been written for the specific failure mode and is committed alongside the fix. This test should fail if the bug is reintroduced.
