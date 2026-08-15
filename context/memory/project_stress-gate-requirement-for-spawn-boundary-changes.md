---
id: P-63V2GTPD
type: project
title: Stress Gate Requirement for Spawn-Boundary Changes
created_at: 2026-06-19T10:22:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 345f82ce3be4d5a3683c2742bab548d1f056fd8cdc8a5b0e9373ac0fc0b0e5c8
related: [stress-gate-required-before-pr-for-spawn-hook-boundary-chang, stress-test-phase-in-pre-merge-workflow, full-gate-re-run-on-final-code-after-code-review]
---

Any code touching spawn boundaries must pass `npm run stress` (5 consecutive runs) before merge.

**Why:** Spawn-boundary code is concurrency-sensitive and unit tests alone do not surface race conditions or transient spawn failures under load.

**How to apply:** Before marking a PR ready for review, run the stress suite as a pre-merge gate for any changes to compress, distill, or curate paths.
