---
id: P-LB6ERVW3
type: project
shape: Timeless
title: Two-Pass PR Discipline
created_at: 2026-07-15T19:58:56Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 33b559e43e002f2cb8be675adf5509d0f8a1dcca649e4b96eac2cdd3909f6359
related: [two-pass-fix-discipline, stress-gate-release-workflow, 5-concurrency-stress-gate-as-pre-pr-verification]
---

- On each review gate completion (skill-review, stress tests, etc.), scan findings and fix them inline in the branch.
- Open the PR only after all gates are green and findings are remedied.

**Why:** Maintains PR quality; reduces review feedback loops and back-and-forth.

**How to apply:** Follow the review sequence: tests → static analysis → stress testing → skill-review. Fix findings locally before opening the PR.
