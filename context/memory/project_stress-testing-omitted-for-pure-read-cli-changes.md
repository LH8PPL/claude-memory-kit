---
id: P-RLKAYYRZ
type: project
title: Stress Testing Omitted for Pure-Read CLI Changes
created_at: 2026-06-12T20:48:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b524c9d276351b1b9c11680cca0902e6287a791a
related: [stress-tests-skipped-for-pure-file-mutation-in-process-ops, stress-gate-requirement-for-spawn-boundary-changes, stress-gate-required-before-pr-for-spawn-hook-boundary-chang]
---

For code changes that consist of pure-read analysis + CLI print output with no spawn/hook/concurrency surface, stress testing is consciously omitted. This decision is documented per the D-120 precedent.

**Why:** Pure-read analysis and CLI printing introduce no concurrency or spawning risks, making stress tests unnecessary and allowing them to be skipped to save CI time.

**How to apply:** When evaluating whether to run stress tests on a PR, check if the change is pure-read analysis + CLI print only. If so, stress testing may be omitted per the D-120 precedent.
