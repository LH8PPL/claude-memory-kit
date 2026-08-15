---
id: P-N9BGGaK6
type: project
title: Transient Failure Retry Strategy
created_at: 2026-06-10T12:45:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ac3255646b062a23797721a263dd2681b1adcae9
related: [vitest-pool-corruption-transient-load-failures, hc-2-distill-freshness-fail-self-clears, known-environmental-artifact-laptop-sleep-during-tests]
---

Jitter-class failures in smoke tests receive one automatic 5-second-wait retry. If still degraded after retry, the test asserts a degradation contract (preserving aged files for next week's retry) rather than failing the gate. Deterministic errors fail fast without retry.

**Why:** A single transient delay can cause false negatives; 5 seconds is low-cost. Distinguishing jitter from real degradation prevents flaky CI while preserving signal for real b
