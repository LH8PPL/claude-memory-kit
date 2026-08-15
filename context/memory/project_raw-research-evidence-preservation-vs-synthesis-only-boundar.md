---
id: P-UKFHGaWD
type: project
title: 'Raw Research Evidence: Preservation vs. Synthesis-Only Boundary'
created_at: 2026-07-01T21:13:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 30b61d35372163e4109df45cdd9a278b4b3ee65ccebc9d9645f400bac312787e
related: [2026-07-01-arc-complete-output-inventory-and-at-risk-layer, research-cycle-workflow-enumerate-triage-deep-read-synthesiz]
---

Raw evidence from the 2026-07-01 research arc exists in session temp files (4 files, ~420 KB):
- `w3kewobmy.output` — comparative-judgment study (152 KB)
- `w7du3zbva.output` — full-field survey with 79-system enumeration (134 KB)
- `wn7itsb41.output` — wave-2 deep-reads (69 KB)
- `wwm9i2k4d.output` — original 9-system analysis (68 KB)

Each contains verbatim code quotes, exact file:line references, per-system analyses, and transferability verdicts. Synthesis notes state: "trusting the agents' verbatim quotes" — meaning they depend on raw evidence for auditability. Files are at-risk (session temp, eventual garbage collection). Re-generation cost: ~4M tokens.

**Why:** Kit design requires decision-trail preservation and evidence-linked claims. Losing raw evidence breaks auditability — a future reader can't verify claims trace to real findings. Synthesis notes are valuable; raw evidence is the ground truth.

**How to apply:** **Preservation:** Commit as `docs/research/raw/2026-07-01-{artifact}/`, register as frozen, and update citation links. Maintains traceability forever. **Synthesis-only:** Accept expiry, document as a design boundary. Choose based on your evidence-preservation philosophy.
