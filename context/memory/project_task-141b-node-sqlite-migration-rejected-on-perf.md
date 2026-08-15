---
id: P-CUV74RDV
type: project
title: Task 141b node:sqlite migration rejected on perf
created_at: 2026-06-16T04:41:11Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 2cf88aa4b501115413e52ad852da9cb660c056a19f9284e25a57263d6c9ed52a
related: [v0-3-2-release-scope-expanded, 141b-is-rejected-decision-rationale, perf-gate-principle-search-speed-non-negotiable]
---

Task 141b (node:sqlite migration) DECISION — DO NOT SHIP, settled 2026-06-16 (D-162) on CLEAN CI data. The CI bench (workflow_dispatch bench-storage.yml, Node 24, run 27594513495) dropped measurement noise to ±0.3-3.7% (vs the dev laptop's ±8-22%), giving a trustworthy verdict: FTS5 keyword query = node:sqlite 1.105x = ~10% SLOWER with only ±0.8% noise (a clean, real regression on the kit's most common read path); sqlite-vec KNN = 0.984x (tie/slightly faster, clean); incremental reindex = 1.322x (~32% slower, noise ±3.7% just over the trust bar but the gap is large). Per D-147's hardened no-measurable-regression bar, node:sqlite FAILS — search latency is paid every query forever, the npm-12 prompt is one-time ("slower is worse than asking y/n on script install"). RESOLUTION: better-sqlite3 STAYS; 141a's install-time --allow-scripts ask remains the npm-12 answer. Spikes 1 (node:sqlite ships FTS5) + 2 (sqlite-vec loadExtension works) passed but are moot — perf is the gate and it failed. The bench harness + CI workflow are kept (re-runnable if node:sqlite's FTS5 perf improves in a future Node release). v0.3.2 ships WITHOUT 141b: final scope = Tasks 153 + 152 + 147.

**Why:** The whole migration was gated on D-147's three spikes; the perf gate is decisive. CI gave clean measurement (noise « the 3% bar) showing node:sqlite is ~10% slower on FTS5 keyword search — the hot path users pay every query. The kit's core purpose is fast local recall; a permanent 10% search regression to avoid a one-time npm-12 install prompt is the wrong trade (the user's settled principle). This closes 141b honestly on real data, not laptop noise.

**How to apply:** Keep better-sqlite3. 141a (install-time --allow-scripts ask + HC-8) is the npm-12 answer. Keep bench-storage.mjs + the CI workflow — re-run them if a future Node release improves node:sqlite's FTS5 perf; until then the decision is SETTLED, don't re-open without new bench data showing the regression is gone. Cut v0.3.2 with scope 153+152+147.
