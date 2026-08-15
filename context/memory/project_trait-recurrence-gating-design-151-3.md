---
id: P-JBDL39TN
type: project
title: Trait Recurrence Gating Design (151.3)
created_at: 2026-06-29T21:20:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 633313f1f44e8573b0fee8dacb803834bee27e330948fc7d7208da439aa1283c
related: [task-151-3-bridge-answer-cite-and-sum]
---

**Wiring pattern: cite-and-sum (B-strict)**
- Classifier emits `PERSONA_CANDIDATE` lines with `source_fact_ids` (not counts).
- Code resolves those ids, sums their `recurrence_count` (from 151.1).
- Gate: promote if sum ≥ 3 (replaces form-gate at auto-persona.mjs:534).
- LLM never counts—code gates on arithmetic only.

**Validation:** 15-system study (wv99dhd5d), unanimous. This pattern handles the asymmetry where synthesized traits are born from LLM (unlike pre-existing units in other 5 systems).

**For 151.3 implementation:**
- Extend `PERSONA_CANDIDATE_RE` + `parsePersonaCandidates` to parse `source_fact_ids`
- Add `resolveRecurrenceSum(source_fact_ids)` helper
- Swap gate at auto-persona.mjs:534
- Validate: reject hallucinated source_fact_ids

**Why:** This design was the open question blocking 151.3. The 15-system study empirically validated it. Saving this prevents re-deriving the same analysis.

**How to apply:** When resuming 151.3, reference this fact for the design rationale, then TDD the implementation steps. Related: kit memory P-C72TUV9Z (resume) + P-MB6NX5EP (bridge study details).
