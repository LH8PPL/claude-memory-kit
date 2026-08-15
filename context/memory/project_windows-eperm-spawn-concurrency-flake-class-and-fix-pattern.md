---
id: P-PRaLBB4a
type: project
title: Windows EPERM/Spawn-Concurrency Flake Class and Fix Pattern
created_at: 2026-06-21T11:37:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f6a70dd310a479527aaa16d4bf603c91558fd29ba5950460f38fc39c45c7fbcc
related: [stress-gate-test-harness-binding-5-rule-for-merge, 5-concurrency-stress-gate-as-pre-pr-verification, stress-gate-requirement-for-spawn-boundary-changes]
---

The project encounters transient EPERM errors under 5× concurrency (pre-existing, not product bugs):
  - `npm pack` at vitest collection time transiently crashes with opaque error under spawn contention
  - Cleanup operations (`rmSync`) throw when OS handle-holds exceed cleanup budget (~1.5s)
  
  Fix pattern (following `renameWithRetry` precedent):
  - Use bounded retry + backoff for spawn-heavy operations (e.g., `npm pack`)
  - Make final cleanups best-effort (do not re-throw after retry loop)

**Why:** These are concurrency-class bugs that only surface under stress; the stress gate reliably flushes them before PR.

**How to apply:** When debugging transient test failures on Windows during spawn/cleanup, suspect EPERM under high concurrency → apply retry+backoff or make cleanup best-effort.
