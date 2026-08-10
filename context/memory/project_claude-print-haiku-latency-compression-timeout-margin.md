---
id: P-9Z63AQE7
type: project
title: '`claude --print` Haiku Latency & Compression Timeout Margin'
created_at: 2026-06-18T14:40:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2431911c2a150f3c03206102ea248f5d39c66f9feec9a7eae341101886433a0a
related: [compression-retry-mechanism]
---

Current Haiku invocations via `claude --print` take 70–89s consistently, against a 50s compression timeout. Historical baseline spans 21–50s with 5 prior timeouts, suggesting either transient load or a persistent CLI/model-routing issue. The timeout budget is marginal.

**Why:** The 50s timeout was calibrated against expected latency (21–50s). Actual latency has degraded significantly, causing compressions to time out and now.md to grow unbounded if failures recur across sessions.

**How to apply:** Before releases that depend on session-end compression, verify `claude --print` Haiku latency is consistently <50s. If persistently slow, either increase timeout budget or investigate `claude` CLI performance with the Claude Code team.
