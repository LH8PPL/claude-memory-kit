---
id: P-WDSE2X3M
type: project
shape: State
title: Memory-Kit Loop System (Tasks 190–193)
created_at: 2026-07-08T11:15:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4b67bab78547a1575f6450d67eeec3af1d57a479f310ce72fa4494f3bfac6666
related: [memory-verification-spans-session-boundaries, learn-loop-artifact-paths-for-cut-gate-checks-recall-expecta, verify-the-autonomous-loop-not-just-the-human-correction-pat]
---

The loop is four interconnected tasks (all merged in v0.5.0):
- **Task 190 (Recall-log):** Records which memory IDs surfaced each turn.
- **Task 191 (Expectations):** Captures assistant PREDICTION lines, resolves to HIT/MISS/REVERSAL in judgment_<slug>.md.
- **Task 192 (Stop-hook judge):** Detects turn-end outcomes (tool failure, user correction, expectation resolved) → trust signals. **This is the loop-closer.**
- **Task 193 (Feedback-screen):** Routes trust deltas through screens (rate limit, quarantine, audit) → trust-signals.log.

v0.5.0 is observe-only (signals logged, not yet ranking-applied). Task 194 (v0.5.1) wires signals into behavior, gated on live v0.5.0 evidence. Design: ADR-0017 + docs/SYSTEM-MAP.md.

**Why:** Task 192 closes the recall→outcome→feedback cycle, making memory self-improving rather than write-only. This 4-task architecture is the core self-learning system.

**How to apply:** When debugging trust signals or outcome-binding, consult this task map. For architectural changes, refer to ADR-0017 and the system map.
