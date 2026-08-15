---
id: P-M5G53Ua5
type: project
shape: State
title: Windows EPERM in Test-150 Cleanup (Diagnosed & Fixed)
created_at: 2026-07-08T11:32:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c6ba886733e828f3860db3c0d0cdd9235e54590159a2bdee628b436aad55fbb2
related: [stress-gate-release-workflow, windows-rmsync-cleanup-flake-workaround, stress-tests-require-git-isolation-task-150-eperm-race]
---

**Root cause of stress test flake (2/10 failure rate):** Task-150 cleanup uses bare `rmSync` while a spawned git child process still holds the tempdir file handle, causing Windows EPERM errors.

**Applied fix:** Drain guard pattern (established in sibling test suites) to allow spawned processes to release file handles before cleanup proceeds. Cleanup-only change; assertions unchanged.

**Status:** Fix deployed; stress suite re-running for verification (5 passes required before commit/PR).

**Why:** Reproducible flaky failure with clear root cause; drain guard is an established codebase pattern for this exact scenario

**How to apply:** Reference this incident when similar Windows file handle issues appear in test cleanup; apply drain guard pattern from sibling suites as the standard remedy
