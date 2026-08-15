---
id: P-KW2B5Y3J
type: project
shape: Absence
title: HC-10 Reports Success While Cron Fails
created_at: 2026-07-08T12:43:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b7ef9cb6fefd82023a838b58d97715fcde21ab84e0809dbb4374df286b8719fd
related: [nightly-cron-fails-due-to-waketorun-false]
---

Heartbeat recorded near task START, before distill completes. If distill fails partway, HC-10 still reports PASS. Hid 5-day silent outage.

**Why:** Critical monitoring blind spot — health check meant to catch failures doesn't

**How to apply:** Modify HC-10 to cross-check recent.md freshness, not just heartbeat timestamp
