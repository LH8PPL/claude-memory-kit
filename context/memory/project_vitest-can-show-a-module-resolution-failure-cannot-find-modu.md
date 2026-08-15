---
id: P-VREAaST9
type: project
title: vitest can show a module-resolution failure (Cannot find module /@id/...) on the
created_at: 2026-06-14T06:51:10Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 5823b6b270967594d158973c5cccc2a04cc62ba3985b095bae60a836de79874c
related: [vitest-pool-corruption-transient-load-failures, stress-gate-requirement-for-spawn-boundary-changes, stress-test-gating-rule-for-pr-approval]
---

vitest can show a module-resolution failure (Cannot find module /@id/...) on the newest test file under stress/parallel runs — an SSR-graph concurrency artifact in the harness, not necessarily a code defect

**Why:** It LOOKS like a test failure in CI/stress, and the lazy reflex is to wave it off as 'known transient' — but that exact reflex is what hid a real CodeQL high-sev alert on this same PR #179. Never assume transient.

**How to apply:** VERIFY FIRST, every time: re-run the file in isolation AND re-run stress. It is ONLY the harness race if BOTH the isolated run passes AND the full suite shows numFailedTests:0 with only a suite-load failure on that one newest file. Any actual test assertion failure, or a non-zero numFailedTests, is a REAL bug — diagnose it. Confirmed-transient precedent: PR #179 stress run-5 (isolated 79/79, suite 1893/1893, re-run 5/5). Do not skip the verification because a prior run looked similar.
