---
id: P-Ga92WPT6
aliases: [P-Ga92WPT6]
type: project
shape: State
title: Assertion-Based Measurement Instrumentation
created_at: 2026-08-08T15:27:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3abe8eef79f9c61899aa391dbf538530bfe58c43de8a3a701ef7b6bf76a8fff0
related: [test-anti-pattern-setup-commands-masking-automation, contract-lock-testing-pattern, windows-ebusy-when-updating-cmk-during-claude-code-runtime]
---

When a feature flag controls which code path runs (e.g., auto-linking being ON or OFF), add an assertion in the harness that verifies the relevant path executed. If the assertion fails, the benchmark output is invalid.
Example: an `appliedEdges > 0` assertion will fail if the auto-link code never ran, preventing silent measurement failure.

**Why:** A silent failure (flag is off, code never runs, no assertion fires) produces misleading benchmarks. Loud failure is better than silent data corruption.

**How to apply:** For any flag flip or conditional measurement path, add an assertion that proves the path was taken.
