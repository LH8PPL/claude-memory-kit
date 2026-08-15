---
id: P-4L9NLWUL
type: project
shape: State
title: 'Doctor-as-a-skill design (2026-07-22 discussion): PRIOR-ART VERDICT — no precede'
created_at: 2026-07-22T13:37:48Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: d3bac21b4df38e366698fe3f32849f8cda74cb7e03fcd9dbaf2600554dadd4b6
related: [doctor-health-nudge-corrected-design-2026-07-22-supersedes-t, a-health-check-behind-a-command-does-not-surface-a-silent-fa, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre]
---

Doctor-as-a-skill design (2026-07-22 discussion): PRIOR-ART VERDICT — no precedent. 'Agent proactively runs a diagnostic/repair CLI when it hits a problem' is a FLAGGED CORPUS GAP (D-374 sweep: 'self-healing CLI repair UX', one of 3 gaps requiring OUTWARD research before designing; blocks 47/48/73). None of the ~101 studied projects do it; closest adjacent is ECC's stale-replay guard (different problem) and the SRE-agent workflow (cited, not shipped). SYNTHESIS reconciling the user's skill-instinct with the kit's own conviction: they COMPOSE, not conflict. The kit's high-trust position (U-U5PPSG7Y + D-169/D-164/D-85; P-G22QZQL2: 'a health check behind a command RELOCATES a silent failure, it doesn't surface it — the real unprompted channel is the SessionStart systemMessage status line') says the NUDGE must be automatic. A skill the AI must CHOOSE to invoke is subject to the under-fire class (D-40/D-153) — so it can't be the whole answer. THE COMPOSE: (1) automatic FAILURE-surfacing via the SessionStart status line whispers 'a health check is failing' with NO model-judgment needed to notice; (2) a troubleshooting SKILL then teaches the AI the diagnose->repair flow (cmk doctor + repair/reindex/forget, how/why/when) once it sees the nudge or hits a symptom. Status-line = the automatic notice (honors D-169); skill = the how-to (the user's instinct). Diagnosis is inherently conditional (can't auto-run 'notice a problem'), so the skill shape is correct for the ACTION half. Extends to other cmk commands as the user noted.

**Why:** My first take (a troubleshooting skill) was half-right but cut against the kit's own recorded conviction that failures must surface via an UNPROMPTED channel, not a command/skill the AI chooses to run. The compose (status-line nudge + skill how-to) honors both, and it is the honest reconciliation — a skill alone repeats the under-fire failure the kit fights.

**How to apply:** v0.6.3+ design/grill task: OUTWARD research first (corpus gap, D-375). Design the two halves: (a) extend the SessionStart systemMessage status line to surface a known-failing health check (needs doctor state to exist without a full run — a cheap cached/lazy signal); (b) a kit-troubleshooting skill teaching doctor+repair on a recognized symptom. Pairs with reframed Task 248 (install-flow auto-recover) — same 'surface/act automatically' theme.
