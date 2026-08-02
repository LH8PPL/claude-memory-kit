---
id: P-9HYFHR3N
type: project
shape: State
title: Viewer Delivery Shape — Candidates and Recommendation
created_at: 2026-08-02T08:14:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 41794b5d90f76e9fb0462a762fbaf9a7b3c78d9b465555689b96d1f25b0cc9d6
---

Three candidate shapes under evaluation for the viewer (v0.6.4's headline):

1. **Localhost server (recommended)**: Node stdlib `http` + embedded HTML/JS, auto-opens browser on free port. Live data: FTS search, health/doctor state, graph edges all current.
2. **Static export**: Single self-contained HTML file, nothing running, but search/health/graph frozen at generation time. Large corpora problematic (~2,000 facts becomes large file).
3. **TUI**: Terminal UI, fits CLI, poor UX for trust chains/graphs/timelines, misaligned with non-developer audience.

**Recommendation:** Shape 1 (localhost). Rationale: kit differentiators (live FTS search, trust tiers, supersession chains, doctor status, recall fire-rate) all require live queries; static export demotes to stale report. Zero-dep constraint satisfied with Node stdlib http.

**Sub-decision:** Browser auto-opens, URL printed as fallback (for non-developer audience).

**Why:** D-121 has been parked since June; viewer delivery shape is the last blocker to v0.6.4. Shape choice drives capability, zero-dep constraint satisfaction, and audience fit.

**How to apply:** Confirm recommendation or redirect; if approved, implement with Node stdlib http + embedded HTML + async Obsidian vault integration. If user chooses (b) or (c), document the rationale shift.
