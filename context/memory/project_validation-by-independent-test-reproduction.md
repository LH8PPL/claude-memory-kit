---
id: P-HRTBEEW2
type: project
shape: Timeless
title: Validation by Independent Test Reproduction
created_at: 2026-07-23T20:26:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 89378e00de316cc4287af5e90b7776d0aede501c4656c537f86bd57d74cfb40d
related: [post-fix-integration-workflow, autopilot-merge-rules-for-install-surface-changes, full-gate-re-run-on-final-code-after-code-review]
---

Fixes are validated by independently re-running the test suite and observing actual behavior (exit codes, runtime state transitions) rather than code reading alone. Example: migration/sentinel composition validity confirmed by running it, not reading the code.

**Why:** Reproduction catches real-world behavior that test fixtures or code review misses.

**How to apply:** When arbitrating correctness disputes, prefer running the suite independently over static analysis; this method proved reliable for Task 256.
