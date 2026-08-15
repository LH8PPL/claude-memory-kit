---
id: P-65KH53NH
type: project
shape: State
title: Fresh CMK Install Health Baseline (cmk 0.4.5, --with-semantic)
created_at: 2026-07-06T12:24:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b0bcc24a989fb466fe36f9c1c3163c69c908d693b336ad077831be4a36a03a42
related: [fresh-cmk-install-expected-cmk-doctor-baseline, claude-memory-kit-health-check-suite-hc-1-through-hc-9, doctor-health-check-baseline-fresh-install]
---

After `cmk install --with-semantic` on a fresh git repo, doctor output is:
- **7 PASS**: HC-1 (hooks), HC-4 (INDEX), HC-6 (native memory disabled), HC-7 (locks), HC-8 (bindings), HC-9 (version match), HC-11 (CLI available)
- **4 SKIP** (expected, not failures): HC-2 (recent.md not built), HC-3 (no transcripts), HC-5 (cron optional), HC-10 (scheduled cron optional)
- **0 FAIL**
- Memory health: 0 fact(s) — fresh scaffold

**Why:** This is the expected healthy state for a fresh installation; useful as a reference for regression testing or comparison against later health checks.

**How to apply:** Save as baseline. If later doctor output shows different results (e.g., a FAIL instead of PASS), it signals a regression or environmental issue worth investigating.
