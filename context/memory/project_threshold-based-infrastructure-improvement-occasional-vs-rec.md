---
id: P-96MH9ZKY
type: project
shape: Preference
title: 'Threshold-Based Infrastructure Improvement: Occasional vs. Recurring'
created_at: 2026-08-02T18:26:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1bdf49bb67508d5d3fd3eda309b87de4ddb17ddc53df78d39d8234806b519e80
related: [npm-registry-instability-and-v0-6-4-workflow-hardening, vitest-pool-corruption-transient-load-failures, onnxruntime-node-ci-download-flakiness]
---

Intervene on infrastructure issues only after frequency crosses from occasional to recurring. Example: 5 CI failures in one week justified the npm-ci-retry composite action, even though a quiet month would make it appear unused. Small fixes are cheap once a pattern becomes recurring tax.

**Why:** Balances infrastructure churn against production friction. Occasional blips don't justify code changes; recurring patterns do.

**How to apply:** When evaluating infrastructure proposals (CI, transient failures, observability), use recurring-vs-occasional frequency as the key decision gate.
