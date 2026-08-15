---
id: P-FG56FKV2
type: project
title: One-differentiator-per-minor rule (D-146)
created_at: 2026-06-19T21:38:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: aebccd11438a5702c6d0e5500723d3cd2f4767023bd7c642508ce28f4ffac80d
related: [v0-3-5-patch-vs-v0-4-0-versioning-logic, kit-versioning-uses-lane-themed-releases-not-strict-semver, versioning-rule-d-24-minor-carries-one-differentiator]
---

Each minor release (v0.X) ships one headline differentiator. Mixing two differentiators (e.g., Kiro + persona-redesign) violates this rule and creates the "squat on the minor" anti-pattern that D-146 was designed to prevent.

**Why:** Keeps release scope clear and focused. Violations delay both features and diffuse impact.

**How to apply:** When considering adding a feature to a minor already committed to a different differentiator, reject the fold-in unless explicitly re-prioritizing (a deliberate decision to change the minor's headline).
