---
id: P-W5BQJPEK
type: project
shape: Timeless
title: Log Flooding From High-Cadence Operations Masks Real Failures
created_at: 2026-08-01T18:25:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b1f13a7929bf42860688d1b1a99970b8bb10ae182575cdd8d007fd8b8eb77e96
---

Health checks reading log tails become blind when high-frequency operations (MCP calls, fact writes) flood the buffer. A real 2-strike failure can vanish behind 150+ routine calls in a 16 KB tail (root cause of B2). Solution: log only transitions (fail always, clear-ok only when resolving a prior failure), plus increase tail size as backstop. Separates signal from noise.

**Why:** Without signal isolation, drift detection and health diagnostics become unreliable; real failures go invisible.

**How to apply:** For high-cadence logging, implement transition-only logging (state-change events, not activity logs). Increase the observation window. Monitor signal-to-noise ratio.
