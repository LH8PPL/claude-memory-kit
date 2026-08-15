---
id: P-D5WM54FS
type: project
shape: State
title: Validation gate chain and stages
created_at: 2026-08-02T18:46:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 16d8044debd5da132e7dafd730eddd2613fc1e8c7232fc6bf65c5267e0e03955
related: [full-gate-re-run-on-final-code-after-code-review, five-point-stress-gate-and-auto-launch-pr-workflow, 5-concurrency-stress-gate-as-pre-pr-verification]
---

The full validation gate runs as a linear sequence: suite (all tests) → stress (stress test, run 5 times) → live-verify:viewer (final verification). Failure at any stage stops the chain and blocks downstream stages. Re-running the chain starts from the suite stage.

**Why:** Future sessions debugging CI failures need to understand the gate structure, stage dependencies, and re-run behavior.

**How to apply:** When a gate stage fails, understand it blocks downstream stages. Fixes typically require re-running the full chain from suite. Stress runs 5× by design for robustness.
