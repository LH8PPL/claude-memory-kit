---
id: P-QGEP9HN9
aliases: [P-QGEP9HN9]
type: project
shape: Timeless
title: npm Lock-Only Dependency Bump Technique
created_at: 2026-08-03T18:36:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a3c08ddca526805249fda18701ed0bd98d4f0512d236c8f42462de68a7839566
---

When fixing security advisories in transitive dependencies, use `npm update --package-lock-only` instead of `npm install`. The latter silently modifies package.json, converting a lock-only security fix into an undisclosed dependency bump that reaches published npm packages.

**Why:** Silent production dependency additions escape review and violate the "empty dependency diff" contract, risking unintended version locks or supply chain implications for end users

**How to apply:** For transitive dependency fixes (CVE/advisory patches), use `npm update --package-lock-only` to preserve package.json intact. Review both package.json and package-lock.json separately in diffs to confirm no manifest changes occurred.
