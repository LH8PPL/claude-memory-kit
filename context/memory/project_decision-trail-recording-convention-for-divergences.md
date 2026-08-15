---
id: P-XZLFTK2A
type: project
title: Decision-Trail Recording Convention for Divergences
created_at: 2026-06-18T06:59:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: dd069d370e277a30d0df68af7c0ce27d9298aad3f2027a85982547519a413031
related: [cmk-decision-trail-requires-divergence-recording, review-based-decision-correction, project-decision-trail-lane-preservation-habit]
---

When implementation diverges from research or original design, document in three places with what-was-planned / what-shipped / why:
- Research note: add "Implementation divergences" section per decision-trail rule
- Design doc: link relevant sections (e.g., §8.2.4 for composition reasoning)
- DECISION-LOG: dated FIX+NOTE at top, tied back to decision ID (e.g., D-169)

Prevents paper-trail gaps where divergences are discovered only in retrospect.

**Why:** Maintains traceability and accountability; enables future context recovery and decision history.

**How to apply:** Update all three artifacts immediately when implementation diverges from plan; don't batch until review.
