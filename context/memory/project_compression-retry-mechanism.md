---
id: P-D6YGVW9L
type: project
title: Compression Retry Mechanism
created_at: 2026-06-18T14:40:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 999d60628fedbf60563c645ea1a4e9d1137a1b1665cbab7141677604f6205d5f
related: [claude-print-haiku-latency-compression-timeout-margin, d6-fail-safe-behavior-on-compress-timeout, doc-completeness-validator-hook-behavior-coverage-gap]
---

Compression rolls retry only at SessionStart (via `detectStaleness` hook), not mid-session. The 120s cooldown marker is set only on *success*, so failed compressions do not block the next retry attempt. Failed runs preserve input (now.md stays intact) for retry at the next SessionStart.

**Why:** If compression times out, the feature fails safely but silently — input is not lost. However, if failures are consistent (e.g., due to persistent CLI latency), now.md accumulates unbounded across sessions until a compression finally beats the timeout clock.

**How to apply:** When troubleshooting compression timeouts, look for `detectStaleness` / `stale-now` triggers in SessionStart logs. If timeouts repeat, expect now.md growth across sessions; recovery depends on `claude --print` latency improving.
