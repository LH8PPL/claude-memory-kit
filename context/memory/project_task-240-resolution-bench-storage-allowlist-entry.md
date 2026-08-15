---
id: P-HS3NQQGR
type: project
shape: Event
title: Task 240 Resolution – Bench-Storage Allowlist Entry
created_at: 2026-07-21T14:26:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 89083a1e6a23de7a90d839cde18d1ea170e85a696b747e455c961796cb521249
related: [task-243-2026-07-21-superseded-the-bench-storage-allowlist-c, task-240-node-version-pinning-across-workflows, d-384-regression-test-uses-conditional-composition-invariant]
---

Bench-storage.yml divergence from .nvmrc Node pin was formalized into validator's LITERAL_ALLOWLIST. Early D-383 decision to move it onto .nvmrc would have crashed the workflow:
- `bench-storage.mjs:29` imports `node:sqlite` unconditionally at module scope
- `node:sqlite` module requires Node ≥22.5; does not exist in Node 20
- Every run fails on import, not a confound or measurement skew

**Resolution**: Bench-storage keeps Node 24 as explicit allowlist entry. Allowlist docstring updated (no longer empty). Entry includes comment citing ≥22.5 requirement.

**Why:** File's own header comment documented this floor but was not consulted during bulk pattern-matching sweep. D-384 lesson: bulk refactors require reading context.

**How to apply:** When adding to allowlist, read target file to understand why it needs a different Node version. Allowlist entry and its rationale must move together.
