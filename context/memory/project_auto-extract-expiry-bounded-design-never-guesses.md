---
id: P-JQ5UBKZ4
type: project
title: Auto-Extract Expiry — Bounded Design (Never Guesses)
created_at: 2026-07-02T11:40:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b5c3eba6d535763079263a420b79e21d917b203b6e3ee66f48eab70af6c59322
related: [b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val, task-66-3-scoped-population-enforcement-both-required, memory-review-discipline-before-commit]
---

Auto-extract's `expires:` field is bounded, not config-buried:
- Scoped to Plan/Event facts only (where a date is concrete)
- Explicit NEVER-guess rule (Door-3.5 pinned)
- Strict ISO-or-omit parsing
- Named cut-gate item for live validation — no invented dates before the tag
Design rationale: LLMs can hallucinate expiry dates; bounding to Plan/Event facts with explicit dates in the turn text prevents silent date invention and corpus corruption.

**Why:** D-258a captures the rationale. Auto-extract is unprecedented; guessing expiry would corrupt the memory corpus. Bounding to Plan/Event facts with stated expiries ensures only facts with obvious, explicit dates are tagged.

**How to apply:** Future work expanding auto-extract to other shapes should revisit the NEVER-guess gate. If LLM quality improves, constraint can be relaxed only after live validation (not silently).
