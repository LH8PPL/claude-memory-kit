---
id: P-a4J4QGEC
type: project
title: 'Verification Gate: Two-Phase Approach'
created_at: 2026-06-21T16:48:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3e17a613a8cfee93dab6fe495d43f3bd05189169eb39c9a75292e535026308b8
related: [post-215-merge-workflow-gate-continuation, live-test-gate-structure-and-blocker-findings, v0-4-0-final-gate-kh-kc-live-hook-firing-tests]
---

Verification split into two phases:
- **Phase 1 (KG-series)**: Read-only scaffolding/structure validation. Fast, no environment dependencies.
- **Phase 2 (KH/KC-series)**: Live IDE+CLI hook checks. Requires Kiro environment. Runs after KG passes and artifact rebuilt.

**Why:** Decouples fast scaffolding checks from slow live-environment checks; allows gate to flow while environment setup happens

**How to apply:** In future runs, complete all KG tests first (they are fast), then KH/KC only when in live IDE; rebuild artifact between phases
