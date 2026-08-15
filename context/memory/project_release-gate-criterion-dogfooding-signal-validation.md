---
id: P-VNDJW7KK
type: project
shape: State
title: 'Release Gate Criterion: Dogfooding Signal Validation'
created_at: 2026-07-07T12:27:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8cacc5b3c5efea99e970f5f20320da96b3bbad645efceae9f4a9624dba2354fd
related: [staged-release-observe-only-then-steering-wiring, v0-3-0-released-with-green-quality-gate, post-215-merge-workflow-gate-continuation]
---

Task 194 (and v0.5.1) is approved only after live-session signal validation. Criteria: run v0.5.0 on this repo, accumulate real correction events in `trust-signals.log`, verify deltas are sensible (no false-positives, no storms), then proceed.

**Why:** Empirical validation is more trustworthy than review consensus. A misfiring judge detector needs a baseline period to surface. Real-world behavior is the primary evidence.

**How to apply:** Treat `trust-signals.log` inspection as the gate artifact. Defer 194 until signal data is reviewed and shows quality.
