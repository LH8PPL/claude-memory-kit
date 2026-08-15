---
id: P-GL7A4BXS
type: project
title: Retry Configuration Strategy by Path
created_at: 2026-06-19T10:22:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 318f4895aa1ade7f0ba9ae13fcbf63a335cc14008cb7aa742ce26e54c15bebc5
related: [sessionend-hook-no-retry-constraint, compression-retry-strategy-for-claude-memory-kit]
---

Retry logic in Task 161 is configured differently by execution path to respect ceiling contracts:
- **Ceiling-free paths** (daily-distill, weekly-curate, lazy compress): `maxAttempts: 2` (one retry allowed)
- **SessionEnd-hook path**: `maxAttempts: 1` (no retry; delegates to lazy compress under D-175 composition contract)

This segregation allows transient failures to be recovered in unbounded contexts while preserving the 60-second ceiling in hook-constrained paths by delegating retry responsibility.

**Why:** The ceiling-free paths have time budget for retry; SessionEnd-hook is constrained and must fail fast to stay under 60s ceiling, shifting retry burden to the lazy path.

**How to apply:** When wiring retry into spawn boundaries, consult the execution context — if ceiling-free, allow retry; if hook-constrained, set maxAttempts=1 and rely on lazy fallback.
