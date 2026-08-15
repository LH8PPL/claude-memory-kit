---
id: P-XGX92LLV
type: project
shape: Timeless
title: onnxruntime-node Postinstall CDN Timeout
created_at: 2026-07-19T20:06:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4ff5d4917e9f2a2cd360e88f39ffd6cd492537178ecfb5d3da223366425db495
related: [onnxruntime-node-ci-download-flakiness, sonarcloud-d-341-known-server-side-crash, vitest-pool-corruption-transient-load-failures]
---

The postinstall script for onnxruntime-node occasionally fails due to transient CDN timeouts. This is a known, documented issue not related to code changes. Workaround: re-run the failed step.

**Why:** Future sessions should recognize this as transient infrastructure noise, not a real code problem, and know to retry rather than debug the code.

**How to apply:** When npm install or CI jobs fail with onnxruntime-node postinstall errors, re-run the step. If it persists across multiple retries, then investigate deeper.
