---
id: P-ZQ6QSWTH
type: project
title: 'Concurrency Flake Root Cause: Real Timeout Under Load'
created_at: 2026-07-02T17:15:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c424db80bf74885af9a1a6a70c32e3f32d4ca22a2b66fcd684c7132dc1aa8386
related: [injection-seam-pattern-for-timeout-critical-tests, timing-assertion-flakiness-in-concurrent-test-environments, test-anti-pattern-setup-commands-masking-automation]
---

Under 5× suite concurrency, real `git status` calls exceeded the 400ms production leash, triggering the designed silent-degrade fallback. This is the correct production behavior. The test flake was timing-dependent: absence-asserting tests expected no timeout, but the timeout actually fired under realistic load.

**Why:** Helps distinguish production bugs from test brittleness. The fallback behavior is correct by design; tests need injection seams to assert it reliably across load conditions.

**How to apply:** When writing timeout-critical assertions, use injection seams to decouple test timeouts from production leashes. Verify fallback behavior is reached and handled correctly under the intended load.
