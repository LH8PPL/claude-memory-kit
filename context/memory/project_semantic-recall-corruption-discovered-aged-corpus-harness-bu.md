---
id: P-WCMBKDHJ
aliases: [P-WCMBKDHJ]
type: project
shape: Event
title: Semantic Recall Corruption Discovered; Aged-Corpus Harness Built
created_at: 2026-08-05T11:00:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 86d8870201753002838d797aa511b2c2ffbaee5c4a7fc0050be77a4a20835745
---

During v0.6.5 visual review, investigation into corpus sparsity revealed semantic recall was returning wrong facts for 86.7% of the corpus. This became the release's primary driver.

All CI tests remained green throughout; the corruption was invisible to automated test coverage.

Remediation: built aged-corpus test harness to detect and prevent similar silent regressions in future releases.

**Why:** The harness now gates the CI pipeline and prevents historical fact drift. This reveal confirmed that user-driven questions uncover real issues more reliably than test suites in this codebase.

**How to apply:** The aged-corpus harness is now part of CI and should be consulted when reviewing memory-mutation changes.
