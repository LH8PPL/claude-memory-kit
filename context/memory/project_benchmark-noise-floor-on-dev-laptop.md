---
id: P-66XJQTaM
type: project
title: Benchmark Noise Floor on Dev Laptop
created_at: 2026-06-15T19:39:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3a603c3665b030e33c6987495e82d72a1c4590f28fe95b51cf725676cd2b4345
related: [task-141b-spike-results-node-sqlite-migration, sqlite-vec-incompatibility-between-better-sqlite3-and-node-s, 141b-is-rejected-decision-rationale]
---

The benchmark harness works correctly, but the dev laptop cannot reliably measure the perf gate (D-147):

- **Operations are sub-millisecond:** FTS5 ~0.1ms, vec ~1.5ms, inc ~0.5ms.
- **Measurement noise dominates:** better-sqlite3 measured against itself 10 times shows 2.2× variance on FTS5/vec, 2.0× on inc.
- **Root cause:** Windows timer granularity + background jitter (Claude Code, OS, CPU throttling).
- **The gate cannot be verified:** 3% tolerance (D-147 ratio ≤1.03) is orders of magnitude smaller than the ±100% noise.

**To get a clean number:** either (a) improve harness with heavier corpus (50k rows, batch queries into ~50ms units) so noise becomes a small fraction, or (b) defer to CI with a quieter runner + heavier corpus.

**Why:** Migration 141b depends on verifying D-147. The user will not push an unverified gate; data quality is the blocker.

**How to apply:** Next session should know this blocks 141b. If revisiting perf, start with the heavier-corpus harness option or a CI job.
