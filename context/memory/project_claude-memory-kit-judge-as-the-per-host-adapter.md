---
id: P-XGACMWP7
type: project
title: 'Claude-Memory-Kit: Judge as the Per-Host Adapter'
created_at: 2026-07-01T15:30:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5939171963676b19a273e0624f945ac6e2d877b737964a6fa9ccc73e15711d1e
related: [architectural-thesis-the-kit-as-cross-session-runtime, ide-to-autonomous-spectrum-same-loop-richer-signals, signal-portfolio-for-learning-loop-in-claude-code-ide]
---

The real architectural axis is **judge quality**, not host type. The learn-loop is universal; the judge is per-host.

**Judge spectrum** (signal quality from strongest to weakest):
- Ground-truth oracle (answer key, monitor cleared) — benchmarks, SRE ops
- Deterministic check (tests pass, `/goal` done, curl works) — available in Claude Code today
- LLM-as-judge — moderate, automated but fallible
- Human reaction (correction, re-ask, forget) — IDE's human-in-loop, weak-moderate, noisy
- Nothing — terse sessions, no signal

**Architecture**: Claude Code has automated judges available TODAY (tests, `/goal`, tool results) plus human reaction. The kit's job is identical everywhere: connect episodes and feed whatever judge exists back into memory. Richer judge → faster learning; poorer judge → slower learning, but same loop.

**Pattern**: Judge is the per-host adapter; loop is universal. Like Task 50's per-agent-data-on-shared-seam pattern, applied to the learn-loop.

**Why:** This corrected framing replaces "agent-specific" sloppiness. It guides ADR-0017 thesis and future host integrations (Hermes, OpenClaw); explains why the kit works host-agnostically.

**How to apply:** Stop saying "agent-specific"; say "the judge is the adapter." For each new host: identify what judges are available (automated or human), wire them into the feedback loop. Same learn-loop structure everywhere; the adapter is the judge selection/aggregation per host.
