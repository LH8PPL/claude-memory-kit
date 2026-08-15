---
id: P-PMJYQEC5
type: project
title: sqlite-vec Incompatibility Between better-sqlite3 and node:sqlite
created_at: 2026-06-15T19:37:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e8a516d642ee57eea91258b1b4a1d831ee89204244ea5114d35669963503515c
related: [task-141b-spike-results-node-sqlite-migration, task-141b-spike-results-perf-inconclusive-on-dev-machine, node-sqlite-fts5-module-availability-gate-for-task-141b-migr]
---

better-sqlite3 and node:sqlite cannot both load the sqlite-vec extension in the same Node.js process — they crash. This forces benchmarking comparisons to run the two libraries in separate processes rather than in-process (alternating), which adds process-startup overhead and measurement noise.

**Why:** Explains why the 141b benchmark produced ±50% variance and why detecting the target 3% perf difference was impossible. Documents a hard constraint on how these libraries can be compared.

**How to apply:** When revisiting 141b or similar benchmarks, plan for separate-process methodology. Accept higher baseline noise. To get a clean number, run on a quiet machine or wire the harness into CI to minimize variance. If single-process benchmarking is needed, evaluate whether one library can run without sqlite-vec loaded.
