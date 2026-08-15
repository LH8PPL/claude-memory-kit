---
id: P-7KJS5Q7K
type: project
title: Compression Retry Strategy for claude-memory-kit
created_at: 2026-06-19T07:14:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 42f7faa5cba75fc8f920e5d7649674da676e8f2cf97ecd8166145d9eaaab55b0
related: [structured-error-logging-for-compress-failures, retry-configuration-strategy-by-path]
---

- **Max attempts:** 2, exponential backoff
- **Retry only transient errors:** HaikuTimeoutError, transient HaikuFailedError (classified via exit_code/stderr logs)
- **Never retry deterministic errors:** ENOENT, 4xx, context-length, policy errors
- **Error-type keying:** use isRetryable(err) classifier
- **Application paths:** daily-distill, weekly-curate, lazy compress (all ceiling-free)
- **Validated against:** 9-system field study — 7 of 7 retrying systems converge on bounded + transient-only approach

**Why:** Transient failures (timeouts, 5xx) are non-deterministic and retry-recoverable; deterministic failures need design fixes, not retries. The ecosystem confirms this pattern.

**How to apply:** Implement compressWithRetry helper with isRetryable classifier. Wire daily/weekly/lazy paths through it. Exclude SessionEnd-hook due to ceiling constraint.
