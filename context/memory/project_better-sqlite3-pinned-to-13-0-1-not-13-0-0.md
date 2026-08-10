---
id: P-YFTSDaCA
type: project
shape: State
title: better-sqlite3 Pinned to ^13.0.1 (Not 13.0.0)
created_at: 2026-07-21T18:17:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4b3256cf9818619a081f8ddfab01dcacce7b463dc24fa675fd988e79ffa7d7c3
related: [cmk-version-bumping-convention, tag-ready-criterion-core-features-pass-known-issues-cleanly, windows-npm-eperm-warning-on-better-sqlite3-node-is-benign]
---

- Package: `better-sqlite3`
- Version: `^13.0.1`
- 13.0.0 contained a cross-realm bug causing vitest failures; 13.0.1 (same-day fix) resolves it

**Why:** Avoids critical vitest incompatibility in initial 13.0.0 release.

**How to apply:** Do not downgrade to 13.0.0. If vitest or cross-realm errors appear in v13 work, confirm 13.0.1+ is in use.
