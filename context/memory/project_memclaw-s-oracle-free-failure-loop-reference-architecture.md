---
id: P-ANRGH3KV
type: project
title: Memclaw's Oracle-Free Failure Loop (Reference Architecture)
created_at: 2026-07-01T15:33:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4131b5dec9169b54eb1fe5da28a3ee4ed1cea40a1621d7554c2694262ebb1cd4
related: [evo-memory-survey-passive-benchmark-oracle-discards-failure, hc-9-drift-after-claude-code-update-v0-3-4, memento-2508-16153-learns-from-failure-survey-verdict]
---

1. Agent self-reports outcome: "I acted on memory X and it failed"
2. Memory weight drops (−0.15, asymmetric)
3. Weight ranks retrieval (failed memory surfaces less)
4. LLM synthesizes corrective if/then rule from failure
5. No oracle needed; no benchmark reward required

**Why:** Proves the loop is transferable to session-host without ground-truth oracle. Only code precedent that closes contradiction→weight→ranking pipeline.

**How to apply:** Reference when designing failure-learning mechanism. Key innovation: self-report is sufficient judge; asymmetric decay avoids trust collapse on single failure.
