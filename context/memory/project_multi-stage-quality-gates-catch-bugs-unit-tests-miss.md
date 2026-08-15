---
id: P-PBCLJ2VB
type: project
title: Multi-Stage Quality Gates Catch Bugs Unit Tests Miss
created_at: 2026-06-13T12:20:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f2aeced2ece768d479ed501ccec6c5c44cfae28d
related: [task-159-multi-stage-verification-gate, live-test-gate-structure-and-blocker-findings, hook-inject-capture-tests-faked-dependencies-masking-bugs]
---

Across the v0.3.x queue (11 merged PRs), the green unit test suite (1883 tests) was necessary but not sufficient. Four additional gates each caught distinct real bugs:
- Stress gate: async race
- Sonar: coverage blind spots (×2)
- Skill-review: prototype-pollution, db-handle leak
- Live-test: future-binary corruption, lazy-binding false-negative, parent-action wiring, threshold mis-setting

**Why:** Unit tests verify isolated units but don't catch async races, untested paths, integration issues, or runtime environment quirks.

**How to apply:** When shipping, verify stress-gate, Sonar, skill-review, and live-test all passing — not just unit green. Budget time for the full pipeline.
