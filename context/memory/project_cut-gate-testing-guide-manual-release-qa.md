---
id: P-MHCAaYVG
type: project
title: Cut-Gate Testing Guide (Manual Release QA)
created_at: 2026-06-10T19:57:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 71dc6c23f91c836b6877c6b150a61f3daef04c99
related: [release-gate-documentation-format-in-cut-gate-md, v0-5-1-cut-gate-includes-six-new-probes-4g]
---

User's standard checklist for release live testing (docs/process/cut-gate.md). Uses ★ markers for critical gates, gate/decision references (G0, D3, etc.) to signal priority, and explicit PASS: criteria. Core principle: "Ran without error" ≠ "works" — guards against four named trivial-path traps. Includes real-input vs. sweep distinction (one-line checks with throwaway probes that won't contaminate production run).

**Why:** Encodes hard-won lessons (D-84, v0.2.0, Task-75) into repeatable process; prevents regression and avoids known gotchas; respects user's time with clear estimates and scope boundaries.

**How to apply:** Reference this guide during release cut sessions; update for new tool features and surfaces when version bumps occur.
