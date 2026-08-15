---
id: P-R3CR23SR
type: project
shape: Timeless
title: Multi-Pass Feature Workflow for Complex Work
created_at: 2026-07-08T07:01:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 57b5a33c3a36b6cde313a3dc2854ef36cfba3c1a262417e8f44374d0980530a3
related: [task-completion-workflow-code-test-doc-review-live-test-merg, release-workflow-after-fix-merge, v0-6-2-release-tail-workflow]
---

Complex features in this project follow a structured workflow:
- **Phase 1: Implementation** — Multi-commit development phase (docs, patterns, wiring, transcript screen, etc.)
- **Phase 2: Validation** — promoteOutcome reporting, full-suite run, sensitivity axis, validators, docs walk
- **Phase 3: Review & Merge** — Two-pass review, stress testing, PR submission, re-gate, final tag

**Why:** This structured approach appears across feature development (e.g., Task 148 spans all three phases); knowing it helps organize future multi-commit work and plan the sequence of steps.

**How to apply:** When starting a new complex feature, use this three-phase structure to organize commits, validation work, and review. Reference it when planning the next steps after initial implementation is complete.
