---
id: P-N5AC9UXY
type: project
title: Cut-Gate Review Process
created_at: 2026-06-17T06:29:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d20802e92df7e16a39b89fe7e600ebfc89f945a12b38630a2504e4d075aa0bef
related: [testing-verification-levels, live-cut-gate-requirement-unit-green-works-on-real-input, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

Before release/merge, unverified items go to a formal "cut-gate" review session (e.g., DJ4 labels unverified decision-journal items). The gate allows manual verification or deliberate acceptance of known gaps before merge.

**Why:** The project distinguishes live-tested (real data) from synthetic-tested (fixtures) from untested (behavioral). Unverified items are explicitly flagged rather than claimed complete.

**How to apply:** When a feature can't be fully live-tested, flag it; the cut-gate session decides whether to manually verify or accept the gap before release.
