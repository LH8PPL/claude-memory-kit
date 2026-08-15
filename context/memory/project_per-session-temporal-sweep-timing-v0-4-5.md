---
id: P-BUXPaHHR
type: project
shape: State
title: Per-Session Temporal Sweep Timing (v0.4.5+)
created_at: 2026-07-04T07:05:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b9253f4bd05013fe29a4db9a9b3266fbf9727d262a710f9dfa52a719c8cbe6dc
related: [sessionstart-hook-activation-narrow-restart-caveat, embedding-cache-is-derived-index-not-primary-memory-storage, version-snapshot-in-recent-md-guards-against-cross-session-a]
---

The temporal sweep (stale "current state" contradiction-catch) now runs at:
- SessionEnd hook
- SessionStart (lazy)
- Weekly backstop

Previously: weekly-only. This change lets a state change captured in one session self-correct by the next session boundary.

Zero cost on idle sessions when semantic detection is enabled (θ=0.80).

**Why:** Vercel→Hetzner state-change case showed weekly-only timing was too slow; session-boundary timing catches it within one cycle.

**How to apply:** All three hooks are in SessionEnd and SessionStart-lazy handlers; no config needed. Enable semantic detection if desired.
