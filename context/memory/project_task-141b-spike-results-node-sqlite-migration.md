---
id: P-T42VTJBJ
type: project
title: Task 141b spike results node:sqlite migration
created_at: 2026-06-15T19:35:35Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 92b54f90157301348229adcda0e442f7ce77d05c129caea71a71bfbc77232975
related: [task-141b-spike-results-perf-inconclusive-on-dev-machine, task-141b-node-sqlite-migration-rejected-on-perf, sqlite-vec-incompatibility-between-better-sqlite3-and-node-s]
---

Task 141b (node:sqlite migration) spike results 2026-06-15: SPIKE 1 (FTS5 under node:sqlite) PASSES — node:sqlite on Node 24.4.1 ships FTS5, openclaw #62328 concern doesn't apply on this version (still experimental-flagged). SPIKE 2 (sqlite-vec loadExtension under node:sqlite) PASSES — loads via loadExtension on Windows x64, requires {allowExtension:true} in constructor + the documented KNN form (WHERE embedding MATCH ? AND k = N ORDER BY distance; the LIMIT-only form hangs at scale). SPIKE 3 (perf bake-off, scripts/bench-storage.mjs) INCONCLUSIVE on this machine — run-to-run ratio variance is ±50% (FTS5 swung 0.39→2.0 across runs), far wider than the 3% gate bar, so a 3% regression can't be resolved on a Windows dev laptop under variable load. Median-of-5-rounds didn't tame it. KEY HARNESS FINDING: better-sqlite3 + node:sqlite CANNOT both load the same sqlite-vec .dll in one process (collides: "vec0 constructor error: bad parameter or other API misuse") — so the accurate interleaved-A/B method is impossible; separate-process A/B adds cold-start noise. NEXT: needs a quiet/CI machine for a clean perf verdict, OR the user decides on other grounds (npm-12 immunity value vs. the experimental-flag risk). Autopilot stop-condition: ship/no-ship is the user's call (touches install surface + inconclusive perf).

**Why:** The three 141b gates were the precondition for the node:sqlite migration. Two pass cleanly; the perf gate is inconclusive on this hardware (noise >> the 3% bar). Cherry-picking a passing run would be the lazy-framing failure — the honest result is 'can't measure 3% here.' The decision now needs either a clean machine or a user call on other grounds.

**How to apply:** Don't claim a PASS/FAIL from a single noisy run. To get a clean perf verdict, run scripts/bench-storage.mjs on a quiet machine or in CI (low background load). The harness itself is sound (separate-process A/B + median-of-rounds; the shared-extension collision is documented in-code). If the user wants to proceed without a clean perf number, weigh npm-12 immunity (the migration's prize) against node:sqlite's experimental flag + the unresolved perf question.
