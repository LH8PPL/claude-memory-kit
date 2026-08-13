---
id: P-7H4BLP3N
type: project
title: Automatic-Oracle-Free Quadrant Is the Real Design Target
created_at: 2026-07-01T20:20:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a5a05d5a296499759afe0324c0616caf8f79cd3da7e598d4d457db7231999697
related: [verify-the-autonomous-loop-not-just-the-human-correction-pat, outcome-signal-portfolio-8-types-2-transferable, ide-to-autonomous-spectrum-same-loop-richer-signals]
---

The project had conflated two independent axes. The actual **target quadrant is bottom-right: automatic AND oracle-free**.

| | Needs human | Automatic |
|---|---|---|
| **Has oracle** | rare | benchmark reward, unit tests (typical ~12 systems) |
| **No oracle** | user correction, thumbs-down | **← THIS quadrant** |

Concrete automatic, oracle-free signals the kit can use today:
- Tool-result/exit-code (command success/failure)
- Self-consistency peer-disagreement (memory conflicts with co-retrieved peers)
- Contradiction/supersession (new fact conflicts with stored one)
- Recall-miss (injected fact didn't surface in recall)
- Used-vs-ignored (was recalled fact referenced in answer, or injected-and-dropped?)
- `/goal` pass-fail (checkable goal resolution is automatic)

**Why:** Kit has no oracle grounding (no benchmarks) and can't rely on continuous human judgment. This quadrant enables continuous failure-learning in background without either dependency. Failure signals (errors, contradictions, misses) are especially automatic to detect.

**How to apply:** When designing failure-learning for claude-memory-kit, prioritize signals in this quadrant. ADR-0017's Decision should emphasize "automatic + no-oracle" as the design thesis, with human feedback as optional enrichment, never a dependency. This is the honest strength vs pretending the kit can do oracle-based learning.
