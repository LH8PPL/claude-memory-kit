---
id: P-5UJHaH4F
type: project
title: Benchmark Harness Noise Floor Rule (3% RSD threshold)
created_at: 2026-06-15T20:54:42Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1be1d2396ffb0e79c8365075934a8ec0c6f43a1c59f32fa09b318738900c5a6c
related: [v0-3-2-release-scope-and-141b-gate, sqlite-vec-incompatibility-between-better-sqlite3-and-node-s]
---

The performance benchmark harness refuses to report a verdict if measurement noise (RSD) exceeds 3%.
- If RSD ≥ 3%: report INCONCLUSIVE with numeric RSD value
- If RSD < 3%: report verdict (PASS/FAIL) with confidence
- Laptop-class hardware typically shows ±8–22% noise
- Dedicated CI runner infrastructure shows near-zero noise

**Why:** Implemented to ensure harness honesty after the user's earlier question "do you get the same results?" This prevents false verdicts on noisy hardware and makes measurement limits transparent.

**How to apply:** When interpreting benchmark results, check the RSD figure. INCONCLUSIVE means the environment is too noisy for a reliable verdict; PASS/FAIL with RSD < 3% is trustworthy. To get a real verdict on task 141b, wire the bench into a dedicated CI runner (~20 min estimated setup).
