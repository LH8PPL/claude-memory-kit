---
id: P-T3YGa7ED
type: project
shape: State
title: Hook Ceiling Enforces Operation Time Caps
created_at: 2026-07-04T06:41:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d3c5a36dda49fc5675f1bf0c6acd2e0b8deaf549b409330aad34db4a759d0960
related: [30s-hook-ceiling-constraint-real-haiku-roll-timing, test-anti-pattern-setup-commands-masking-automation, cursor-hook-debugging-via-environment-probe]
---

The hook ceiling is 60 seconds. Operations that run under hooks (e.g., SessionEnd sweep) must be capped to at most 50 seconds to stay safely below the hard limit and avoid SIGKILL during mid-write. SessionEnd sweep was originally defaulted to 120s uncapped — caught in self-review and capped to 50s with test lock.

**Why:** Hook hard ceiling is a real operational constraint; operations that overflow it will be killed mid-flight, corrupting state. Defensive design caps at 50s to provide headroom.

**How to apply:** When adding or modifying hook-triggered operations, cap time ceiling to ≤50s. Verify with tests that the ceiling cannot be exceeded.
