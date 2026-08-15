---
id: P-JCRD4Z7D
type: project
title: High-Impact Signals to Prioritize for Implementation
created_at: 2026-07-01T20:24:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 618308656fe598bcffa5f5c7e5124b559dd5053b2be55822f9e91dd4aeb50734
related: [seven-novel-signal-types-for-memory-learning-27-system-surve]
---

**Near-term (oracle-free, automatic, fits existing infrastructure):**
- **Negative-case-as-exemplar** — retain failures as typed anti-pattern facts, not pruned; markdown model supports it.
- **Peer-disagreement** — detect when recalled fact contradicts co-retrieved neighbors; set-level anomaly, maps onto Poison_Guard lane.

**Medium-term (powerful but require infrastructure):**
- **Blame-attribution** — requires tracking "which facts were recalled for this turn" (not currently tracked).
- **Held-out replay gate** / **Rejected-edit buffer** — both need past-task replay infrastructure.

**Why:** Immediate signals are oracle-free, automatic, low-cost. Heavier signals are powerful but blocked on recall-tracking. Negative-exemplar is the cheapest novel idea.

**How to apply:** For near-term ADR-0017 build, focus on negative-exemplar and peer-disagreement. Document recall-tracking as a blocker for heavier signals. Prioritize recall-tracking as a separate foundational task.
