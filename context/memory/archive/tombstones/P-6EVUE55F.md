---
deleted_at: 2026-07-26T07:41:38Z
deleted_reason: 'expired: declared expires_at 2026-07-24 passed (swept at 2026-07-26T07:41:38Z)'
deleted_by: expiry-sweep
id: P-6EVUE55F
type: project
shape: Plan
title: Task 208 — Interactive Live-Gates Pending Token Refresh
created_at: 2026-07-13T13:58:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 15403939ddf22262146f10e798bbbd25a525f48e0a2740f56c3f584207480a1d
expires_at: 2026-07-24
---

Cursor and Codex interactive live-gate tests are flagged pending; both require active agent tokens with expected refresh ~2026-07-24. Adapter code verified via CLI/automated paths; only exhaustive interactive sessions await token availability.

**Why:** Blocks final release sign-off but not code freeze.

**How to apply:** Defer task 208 until token refresh window; it is release-gating but not a blocker for v0.5.2 ship.
