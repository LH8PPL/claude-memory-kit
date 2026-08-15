---
id: P-TASRaWE2
type: project
title: Structured Error Logging for Compress Failures
created_at: 2026-06-19T05:34:45Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 10ac0f65c2f79d91a933f16fc0eb71bf21cdc884c4b73c3f25cb21a29cc5171f
related: [compression-retry-strategy-for-claude-memory-kit, compress-logger-observability-gap]
---

Implemented HaikuFailedError (mirrors HaikuTimeoutError) with { category: 'haiku_failed', exitCode, stderr }. All three compress callers (compress-session, daily-distill, weekly-curate) log to compress.log: exit_code (numeric) and error_detail (stderr, capped 500 chars). Tested TDD: 69 tests, all passing; live-verified with real exit_code:9.

**Why:** Observability gap prevented distinguishing transient failures (retry helps) from deterministic ones (retry re-fails). Structured logging enables data-driven retry design instead of assumptions.

**How to apply:** When closing observability gaps, structure errors as semantic types carrying diagnostic metadata; ensure all callers log consistently. This defers feature design until real failure patterns can be analyzed.
