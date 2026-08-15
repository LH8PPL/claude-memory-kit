---
id: P-D6VRFY9Z
type: project
title: Injection-Seam Pattern for Timeout-Critical Tests
created_at: 2026-07-02T17:15:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c13b0770848de593d22aa5b9e068074fbc18cb5665bfa376e6fe4c69c44921b4
related: [concurrency-flake-root-cause-real-timeout-under-load, gate-testing-isolated-throwaway-folders, test-anti-pattern-setup-commands-masking-automation]
---

When testing behavior under a production timeout leash (e.g., 400ms git status limit), use an injectable timeout parameter to allow tests to run with a generous timeout while production retains the reviewed leash. Applied here via `testGitTimeoutMs`, mirroring the existing `testSpawnLazy` injection pattern.

**Why:** Under concurrent load (5× suite), production timeouts can actually fire, causing tests that assume quick completion to fail. Decouples test execution speed from production timeout behavior.

**How to apply:** Create an injectable parameter for each timeout-sensitive subsystem. Positive tests inject a high timeout; production code wires the reviewed leash. Follow existing injection idioms in the codebase when adding new ones.
