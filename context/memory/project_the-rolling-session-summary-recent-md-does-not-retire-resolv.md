---
id: P-VaK5DNNa
type: project
title: The rolling session summary (recent.md) does NOT retire RESOLVED threads — a com
created_at: 2026-06-25T13:28:20Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: ae8a368d76542719e816af449f5596780b9d58ae3d89adf9ea4d090d8d829dc1
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, lazy-on-sessionstart-roll-doesn-t-fire-on-size-bloated-now-m, two-post-v0-3-2-bugs-index-corruption-and-stale-snapshot-for]
---

The rolling session summary (recent.md) does NOT retire RESOLVED threads — a completed multi-day epic leaves a stale 'pending' line in the injected snapshot (e.g. v0.4.0 shipped but recent.md still injected 'Kiro adapter seam: RESEARCH-FIRST, pending'). MEMORY.md auto-capture works; the gap is thread-RESOLUTION not propagating to the rolling summary tier.

**Why:** A stale 'pending' line in the injected context is the cross-session-amnesia failure the kit exists to kill, applied to the kit's own session summaries. The next session reads a resolved epic as still-open.

**How to apply:** When a thread resolves (epic ships, task closes), the rolling-window compression should reconcile/drop the matching Active-Threads line in recent.md, not carry it forward verbatim. Until that's automated, a session that ships a major lane should correct recent.md's Active Threads. v0.x candidate: a 'thread-resolution sweep' in compress-session.
