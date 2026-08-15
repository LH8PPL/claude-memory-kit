---
id: P-WCKMLAGA
type: project
title: Kit Design Methodology & Current State
created_at: 2026-07-01T21:21:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9bdc8cc831cfb2ec8c3c6a5b6e0c5eb3ace4f49d62131ad5fe88abb8dc68b88b
related: [adr-0017-finalization-agenda, design-discipline-keep-systems-whole]
---

The kit's synthesis method has four steps:
1. **Who** — identify systems that learn from memories
2. **How** — analyze their mechanisms  
3. **Fit-filter** — assess against kit constraints (D-169, markdown-as-truth, scale, asymmetry, §20.3)
4. **Draw-the-machine** — design the complete system with the loop closed

Current state: Steps 1–3 are complete (diagnosis + field evidence + constraints). **Step 4 (design synthesis) is missing.**

The missing artifact is Figure 2: the target SYSTEM-MAP with the feedback loop wired end-to-end, specifying:
- Signal paths (Stop hook, auto-extract, recall-log → judge)
- Judge portfolio (automatic-first, human-optional, both-polarity)
- MEASURE split (fact-utility via Memoria formula; method-judgments with confidence gates)
- Feedback-screen (security boundary)
- CURATE gates (survival, decay, negative-exemplars)
- All constraints wired in

**Why:** Figure 2 is the integration point where the entire research effort culminates. Without it, work stays scattered (ADR sketches, backlog fragments, parts-in-a-bin). With it, design becomes one coherent machine and ADR-0017's Decision becomes finalizeable.

**How to apply:** Draw Figure 2 together, walking the fit-filter over the complete loop as one system. This closes the "decide step" — not a fragmentary task, but integrated synthesis.
