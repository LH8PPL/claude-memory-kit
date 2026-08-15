---
id: P-AY6TaRLY
type: project
shape: Timeless
title: Task completion workflow — code, test, doc, review, live-test, merge
created_at: 2026-07-16T08:18:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 664434cf3c1190a14f8d4a5c3acc694167c5df1c3af3380e26c33096733b4434
related: [multi-pass-feature-workflow-for-complex-work, task-159-multi-stage-verification-gate, task-210-deletion-propagation-guarantee-in-flight-code-done]
---

Multi-phase approach observed across Tasks 96 and 210:
  1. Code implementation
  2. Unit test suite (typically 10–30 tests)
  3. Stress testing (appears to use "5/5" protocol)
  4. Documentation walk (HEALTH-CHECKS.md, LIFECYCLE-MAP, design.md, CLI.md, CHANGELOG, tasks.md, DECISION-LOG)
  5. Multi-pass review (skill review, two-pass review mentioned)
  6. Live testing (end-to-end validation, catches real edge cases)
  7. Merge + post-merge memory-flush commit (uncommitted context/DECISIONS.md stays local until merge)

**Why:** Project convention; defines when a task is truly complete and what gates must pass.

**How to apply:** Plan new tasks with these phases in mind; expect work to span multiple review gates and live validation before merge.
