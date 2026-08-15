---
id: P-3H5NPLNC
type: project
title: README/CHANGELOG Update Timing
created_at: 2026-06-20T16:29:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 28dc75b6bd89183c40fd4b7cac1d9f552ef997c816e404e7c53f44b100a1abd0
related: [clean-pre-existing-table-lint-warnings-by-default, doc-update-release-boundary-rule, silent-auto-drain-optional-warmth-design-pattern]
---

README and CHANGELOG update only when a user-facing capability ships—not when internal primitives or plumbing tasks complete

**Why:** Prevents "lazy-framing-as-docs anti-pattern" of documenting unshipped features as if they're already live

**How to apply:** Hold README/CHANGELOG updates until the relevant user-facing task (e.g., 50.F for `--ide` flag) is complete and shipped
