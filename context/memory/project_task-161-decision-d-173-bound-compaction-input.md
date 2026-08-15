---
id: P-FDATL4KY
type: project
title: Task 161 Decision D-173 — Bound Compaction Input
created_at: 2026-06-18T20:09:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4ba5dcc83bd19c892c91519594414f26cfb17cce4a9d951bf7d15b031bd4eb06
related: [now-md-assistant-cap-precedent, a-c-core-design-pivot-memsearch-anchored-b-dropped, overflow-handling-caveat-single-buffer-vs-memsearch-s-many-f]
---

- **Decision:** Bound the compaction input; do NOT raise the timeout.
- **Settled by:** 17 of 19 studied systems converged on bounded-input approach. Kit inherited unbounded shape from claude-mem/claude-remember; bounded input is field standard.
- **Four adopted mechanisms:** (A) hard input cap + keep-last-N pre-trim, (B) mid-session now.md size cap (automatic drain), (C) partial-evict, (D) shrink-and-retry.
- **Applied across:** compress-session, daily-distill, weekly-curate, plus bounded SessionEnd drain.
- **Why chosen:** Original 2026-05-21 design specified 3s-p95 latency guard (never wired in); this decision implements that unimplemented guard.

**Why:** 17-of-19 system convergence validates bounded-input as proven, safe path. Closes gap from design inception.

**How to apply:** Implement test-first (mechanisms A–D in compress-session path). Boundary tests validate input_bytes-based caps prevent unbounded compression.
