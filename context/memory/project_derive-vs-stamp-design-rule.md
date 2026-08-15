---
id: P-Q9MSP5YP
type: project
title: Derive-vs-Stamp Design Rule
created_at: 2026-06-25T19:35:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 980971fa8760323f1ee37e0f51a9157fd0b37d6a243caa1ba57a889348a2b95d
related: [adr-0002-derive-state-from-artifacts-avoid-markers, q2-design-rule-gnu-make-4-8-derive-when-wyz57ux4, task-done-goal-explicitness-rule]
---

Derive state when the work's product already encodes it (e.g., artifact mtimeMs encodes "a run happened"); stamp explicitly only when a signal is essential but NOT encoded in products (e.g., cron liveness heartbeat). Grounded in GNU make §4.8 and ADR-0002.

**Why:** ADR-0002 prefers state encoded in artifacts; explicit markers should be minimal and justified. Reduces marker bloat and keeps artifacts as source of truth.

**How to apply:** Ask: does the artifact encode this? If yes, derive. If no and essential, add minimal stamped marker. Example: `recent.md` freshness derives from mtimeMs; `last_heartbeat` stamps for cron liveness.
