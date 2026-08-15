---
id: P-NBX7JNEN
type: project
shape: Timeless
title: Stress Test Phase in Pre-Merge Workflow
created_at: 2026-07-19T06:06:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f9f83c2c9e97d0f5efa10f1ef7d03e0a71c47ded3b8ad718c575f45c34f23564
related: [stress-gate-required-before-pr-for-spawn-hook-boundary-chang, stress-gate-requirement-for-spawn-boundary-changes, stress-gate-release-workflow]
---

Stress testing (5× full suite, ~15 min) is a standard quality gate before PR → CI → automerge.

**Why:** Catches concurrency-sensitive and load-sensitive flakes before merge.

**How to apply:** Expect stress test as part of pre-merge verification; budget ~15–20 min for this phase.
