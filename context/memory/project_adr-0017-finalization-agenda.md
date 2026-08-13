---
id: P-9BDaHHAE
type: project
title: ADR-0017 Finalization Agenda
created_at: 2026-07-01T21:11:21Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 916beeeebb38a2ef6e578614030f2131b50dac7042663519fd9c8799ff45fff6
related: [kit-design-methodology-current-state, corpus-re-read-decision-audit]
---

Four edits to finalize ADR-0017:
1. **Confidence-gating for similarity⊕trust blend** — two-axis split: fact-utility (near-ready) vs. method-judgments (provisional-only). The comparative-judgment study added this qualifier after the original Decision(b) was written; ADR does not reflect it.
2. **Honesty as differentiator** — open the Decision with "never lie about how much you know." Emerged only from full 47-system + 10-system survey comparison; is the kit's true differentiator vs. cheating with oracles.
3. **Feedback-security as Consequence** — the learn-loop adds an unscreened input channel. Systematically-wrong signals could bury true facts without file-level attacks. Violates the kit's own security principle.
4. **Wedge mechanics unfinalized** — pre-registration direction is set but hook/cost/ritual are undesigned. Note in Task 185 filing.

**Why:** Survey landed twice; ADR still said "in progress." Confidence-gating is critical to coherence. Honesty-differentiator emerged only in corpus-level context. Feedback-security is an unexamined gap.

**How to apply:** Prioritize this as the first action of decide-step. Update ADR-0017 with these four edits before filing Task 185, ensuring ADR and execution plan align.
