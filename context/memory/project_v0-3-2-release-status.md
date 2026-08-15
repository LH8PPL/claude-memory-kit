---
id: P-AE2R9TUU
type: project
title: v0.3.2 Release Status
created_at: 2026-06-15T19:36:07Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 854d2e229d13f9fdf30f744c62e877e2b7f2bf4532c21690090f2aee0068700e
related: [v0-3-2-release-scope-locked, v0-3-2-scope-locked-strict-task-order-discipline, v0-3-2-release-scope-and-141b-gate]
---

- **Shipped (merged to main)**: Task 153 (FTS5 sanitization), 152 (validate-index-completeness), 147 (cmk digest + DECISIONS.md), js-yaml security bump, README rewrite, CONTRIBUTING.md
- **Deferred**: Task 141b (node:sqlite migration) — perf verdict pending
- **In progress**: Task 141a (npm-12 immunity)

**Why:** v0.3.2 is release-ready without 141b. Task 141a already covers npm-12 pain. 141b ships later with stable perf data.

**How to apply:** Use as v0.3.2 release notes baseline. Default to 141b deferred next session unless clean perf measurement exists.
