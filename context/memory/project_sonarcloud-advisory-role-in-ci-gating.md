---
id: P-4VZZY6W2
type: project
shape: Timeless
title: SonarCloud Advisory Role in CI Gating
created_at: 2026-07-12T18:38:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0d2f4933b69fb555350b74b6abe19ac796566446df3ed787e4ab710c3b1698a1
related: [cmk-hook-capture-fails-during-stress-gate, tag-ready-criterion-core-features-pass-known-issues-cleanly, patch-release-strategy]
---

SonarCloud is **advisory-only** in this project's CI — not a blocking gate. Real gating checks: CI, CodeQL, gitleaks, osv-scanner, npm-audit (all green). SonarCloud red does not block releases. Pre-existing D-39 hotspots-reviewed gate is documented as accepted red (free-tier limitation).

**Why:** v0.5.1 published successfully despite SonarCloud crash. Prevents over-investment in fixing advisory-only tooling and clarifies severity hierarchy.

**How to apply:** When SonarCloud shows red, determine if it's a known issue (D-39, Task 224) or new. Advisory red does not require release delays or critical urgency.
