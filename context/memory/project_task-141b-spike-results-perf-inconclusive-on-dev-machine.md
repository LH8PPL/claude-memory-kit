---
id: P-DSRXEXRL
type: project
title: Task 141b Spike Results — Perf Inconclusive on Dev Machine
created_at: 2026-06-15T19:36:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 69d30cf5f3d9fd7884a137cf5828248f745f11dec9e8ea6a0dac3cccb9e530a6
related: [task-141b-spike-results-node-sqlite-migration, sqlite-vec-incompatibility-between-better-sqlite3-and-node-s]
---

- **Gate 1** (FTS5 support): ✅ PASS — node:sqlite 24.4.1 ships FTS5
- **Gate 2** (sqlite-vec loading): ✅ PASS — Windows x64
- **Gate 3** (perf bake-off ≤1.03×/3% bar): ⚠️ INCONCLUSIVE — ±50% run-to-run variance; 3% threshold unmeasurable under variable load
- **Benchmark harness**: `node --experimental-sqlite scripts/bench-storage.mjs`

**Why:** Stable measurement impossible on variable dev machine. Cannot proceed without clean data (guessing or cherry-picking would be the trap).

**How to apply:** Next 141b session: prioritize stable perf measurement (quiet machine or CI integration) before deciding to migrate. Defer 141b until then.
