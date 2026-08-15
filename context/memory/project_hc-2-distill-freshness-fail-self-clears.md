---
id: P-VMC25Z3S
type: project
shape: Timeless
title: HC-2 Distill Freshness FAIL Self-Clears
created_at: 2026-07-07T18:28:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9b62da6888e587dd50d5d7476fb16d6ed47b8a7ca445c1c4e767d6049131186e
related: [npm-test-fragility-under-load, onnxruntime-node-postinstall-cdn-timeout, youtube-to-slide-foreign-format-fact-file-pre-existing-not-r]
---

Health check HC-2 (distill freshness) sometimes fails due to live-Haiku API jitter. This is a known transient that self-clears on retry. Not a blocker for gating.

**Why:** The check measures API response time; network fluctuations cause false negatives without indicating a real problem.

**How to apply:** If HC-2 fails during a gate health check, retry. If it passes on retry, proceed normally.
