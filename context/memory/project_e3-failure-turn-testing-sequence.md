---
id: P-6XJBP7RE
type: project
shape: Timeless
title: E3 Failure-Turn Testing Sequence
created_at: 2026-07-12T17:43:46Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b6481ffa60a2d37fa6b875c08d6f28909e178579e68a07272d73290be032d8f4
related: [b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val, v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g, memory-persistence-validation-workflow-end-to-end]
---

Multi-step workflow to validate learn-loop failure signals in session `cut-gate-coldopen-v51`:

1. Paste: "Run `uv run pytest tests/test_nonexistent.py` and tell me what happens."
2. Pytest fails intentionally (test file doesn't exist)
3. Send a trivial second message (e.g., "thanks") — critical timing step
4. Report "done" and verify `trust-signals.log` for signal delta

**Timing detail:** The detached Stop-hook child judge runs outside the main turn and writes its signal a few seconds into turn N+1. The second message creates a window for the judge to complete before the session ends.

**Why:** E3 validates persona injection and failure-signal detection; the two-turn sequence captures both the failure outcome and the detached judge's log

**How to apply:** Always follow this exact sequence for E3 validation; never skip the second message—it's not optional
