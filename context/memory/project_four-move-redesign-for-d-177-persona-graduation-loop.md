---
id: P-WF2SKRFP
type: project
title: Four-Move Redesign for D-177 (Persona Graduation Loop)
created_at: 2026-06-29T13:13:20Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: bf7bf124820b6c65d6d515d1434b89ff9907568d9272ed5bba44a6ebbad83575
related: [d-177-self-defeating-loop-in-persona-graduation, resume-point-task-151-4-move-2-demote-not-evict]
---

Task 151 addresses the D-177 self-defeating loop where promoted traits overflow the 1800B cap → graduation evicts them → fragments/ isn't injected → traits vanish at cold-open.

**Solution: four coordinated moves**
- **Move 1 (Recurrence gate)**: Replace form-based confidence gate with full recurrence engine (tracks cross-session frequency). [heavyweight build; no recurrence counter exists today]
- **Move 2 (Eviction)**: Exempt `trust:high` durable persona from graduation; make sweep drop low-trust AND long-unaccessed bullets first. Grounded in Hermes "pinned bypasses transitions" + captain-claw "validated never decays" + graphiti access-staleness pattern.
- **Move 3 (Routing)**: Topic-spread explicit-promote to match auto-persona routing (fixes D-177 routing asymmetry).
- **Move 4 (Drain + mention)**: Silent auto-drain of stale bullets + optional in-convo mention (D-169 + awrshift).

Move 1 is the real engineering effort. Moves 2/3/4 are more contained.

**Why:** Task 151 is fixing D-177, a self-defeating loop where high-trust persona traits are evicted due to cap overflow. The redesign is research-backed (Hermes/captain-claw precedents) and complete — all four moves are decided and grounded.

**How to apply:** Reference during Task 151 implementation. Move 1 (recurrence engine) is the heavyweight engineering lift and will require most design grilling; Moves 2/3/4 are containable. Prioritize implementation resources to Move 1.
