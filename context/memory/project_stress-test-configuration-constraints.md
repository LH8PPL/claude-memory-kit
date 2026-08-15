---
id: P-SaCABUM9
type: project
shape: State
title: Stress Test Configuration & Constraints
created_at: 2026-07-22T07:17:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ee026c0d90d72ce96fb3016ee152cd3cb8c389f732434ea9ffb4b4263b22b4d0
related: [validation-gate-chain-and-stages, stress-test-suite-timing, vitest-pool-corruption-transient-load-failures]
---

- Setup: 3 vitest workers, 5 full-suite runs ≈ 18 minutes total
- Constraint: do NOT edit repo files during stress iterations (validator prerun re-runs each iteration; mid-run edits contaminate the measurement being validated)

**Why:** Baseline timing and no-edit discipline prevent measurement corruption and false signals in future stress test sessions

**How to apply:** When running stress tests, allocate ~18 minutes for 5 runs, keep working tree untouched until completion
