---
id: P-GaVNA72G
type: reference
title: OpenWolf Heartbeat & Cron-Health Patterns
created_at: 2026-06-25T19:55:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ea2027d6073a63fa237c1b688445e49d7490adb2d87acdc49f46376a42c737e2
related: [cron-liveness-gate-by-heartbeat-age-task-167-a]
---

- Single-writer model: the scheduler writes the heartbeat; no other component modifies it
- Two surfaces: write (scheduler records heartbeat) separate from read (module checks freshness)
- Freshness check by age, never existence: verdict based on elapsed time since last heartbeat, not whether marker exists
- Diagnostics surface raw value: health/status commands expose the heartbeat timestamp, separate from verdict logic

**Why:** OpenWolf peer code validates heartbeat design patterns; these patterns should inform any cron-liveness module interface

**How to apply:** when building cron-health checks, follow single-writer + age-threshold design; separate diagnostic output from verdict logic
