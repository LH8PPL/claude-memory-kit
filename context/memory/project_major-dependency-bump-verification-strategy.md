---
id: P-XYXZ55YA
type: project
shape: Timeless
title: Major Dependency Bump Verification Strategy
created_at: 2026-07-21T18:17:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 56804097cd52d68a096df94ead9b58ffbecd46681b16241d02bb4752e02a592d
related: [full-gate-re-run-on-final-code-after-code-review, comprehensive-pr-review-methodology, task-141b-node-sqlite-migration-rejected-in-d-162]
---

- Full test suite: all passing (3341/3341 on v13)
- A/B acceptance: run prior published version vs. new build in clean sandbox; compare for unexpected regressions (e.g., deprecation warnings)
- Smoke tests: verify key features using the bumped dep (e.g., FTS5 search, sqlite-vec KNN loading, extension init)
- Regression verification: confirm unrelated features untouched (e.g., D-162's node:sqlite rejection)

**Why:** Major versions can break features silently or introduce tool noise. A/B acceptance catches tool-level changes unit tests miss.

**How to apply:** Use this checklist before merging any major dependency bump. Suite alone isn't enough.
