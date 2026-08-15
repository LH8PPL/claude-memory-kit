---
id: P-RKHLCEET
type: project
title: Release Documentation Convention (Bug Fixes vs Features)
created_at: 2026-06-14T07:58:18Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 78565cda0c198dc604a2a9af6a0c32832894d01f
related: [doc-update-release-boundary-rule, cmk-version-bumping-convention, v0-6-0-installed-precompact-task-235-waiting-for-release]
---

- Bug fixes without new user-visible capability → CHANGELOG only
- Features/new capabilities → both CHANGELOG and README
- Version banners: preserve old version info across releases per decision-trail rule

**Why:** Keeps release history clean and searchable; ensures README reflects actual feature set, not implementation fixes

**How to apply:** Apply to all future releases; update README only when adding user-visible capability; preserve decision history in banners
