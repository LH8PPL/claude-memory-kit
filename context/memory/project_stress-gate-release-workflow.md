---
id: P-E3JKT3HN
type: project
shape: Timeless
title: Stress-Gate Release Workflow
created_at: 2026-07-11T19:53:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 30ecaf4aab3589e28b9876546daf0098ff062e4d2aa2b92593957b0d4f1b3d1b
related: [stress-test-phase-in-pre-merge-workflow, 5-concurrency-stress-gate-as-pre-pr-verification, stress-gate-required-before-pr-for-spawn-hook-boundary-chang]
---

Changes must pass a stress-testing gate before landing in this project:
- Freeze the repo (block writes)
- Run stress suite 5 times (5x all-green required)
- Only after all stress passes: commit → PR → merge → retro
- No repo writes allowed until stress gate completes

**Why:** Validates concurrency safety and robustness before changes are merged; part of the project's release quality standard

**How to apply:** When landing a fix or feature, wait for stress gate to complete before committing; don't bypass this gate
