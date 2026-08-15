---
id: P-4D7KC5QA
type: project
shape: Timeless
title: D-384 Regression Test Uses Conditional Composition Invariant
created_at: 2026-07-21T18:17:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e17f3910f7d039f948fa3706dbac44944c9719922054d17a2e96034c20822adc
related: [task-243-2026-07-21-superseded-the-bench-storage-allowlist-c, windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, node-version-floor-bumped-to-22-in-v0-6-2]
---

- Conditional rule: (`.nvmrc` <22) ⇒ (allowlist entry required); (`.nvmrc` ≥22) ⇒ (allowlist empty)
- Test verifies a RELATIONSHIP between floor and allowlist state, not a fixed value
- Survives Node floor bumps in either direction without rewrites

**Why:** Decouples test logic from a specific Node version. Relationship-based logic is robust to future floor changes.

**How to apply:** If D-384 fails on a future floor bump, verify the conditional relationship holds. Do not manually override allowlist; check the logic instead.
