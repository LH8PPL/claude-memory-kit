---
id: P-AV5XGE69
type: project
shape: Event
title: Task 240 — Node Version Pinning Across Workflows
created_at: 2026-07-21T13:49:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 885d9736f544ada9be13f194ff36ee448da005faf96e0514328c741e36b56604
related: [task-240-resolution-bench-storage-allowlist-entry, reference-implementation-alignment-strategy, task-243-2026-07-21-superseded-the-bench-storage-allowlist-c]
---

- **Problem:** `node-version` literal copy-pasted in 10 blocks across 8 workflows; divergence already present (bench-storage ran Node 24, gates ran Node 20)
- **Solution:** Centralize to single `.nvmrc`; all workflow blocks read from it
- **Validator:** `validate-node-pin.mjs` fails build on bare literals; empty allowlist by design to force documented divergence
- **Proof:** Planted test value (`node-version: 18`), verified exact failure message and remedy, reverted clean
- **Design choice:** bench-storage joins the pin rather than staying as documented divergence (rationale: benchmark with different major version than gates is a silent confound on benchmark validity)

**Why:** Silently divergent runtimes between benchmark and gates hide configuration drift and undermine benchmark numbers. Structural validation prevents future regression.

**How to apply:** Use this architecture pattern when similar multi-block config-consistency issues arise; the empty-allowlist validation pattern is reusable elsewhere.
