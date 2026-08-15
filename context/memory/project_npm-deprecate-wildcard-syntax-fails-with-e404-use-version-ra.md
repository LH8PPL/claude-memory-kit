---
id: P-7BSXRX4F
type: project
shape: Timeless
title: npm deprecate Wildcard Syntax Fails with E404; Use Version Ranges Instead
created_at: 2026-07-15T12:17:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 111e68eaa0743664b6d87d34ef83e9a2ef49d1ae4d7978e674ffa2d563e19567
related: [npm-deprecate-e422-bug-with-version-ranges, npm-glob-expansion-fails-in-powershell-use-explicit-filename, npm-11-x-deprecate-command-with-version-ranges-fails-with-sp]
---

Using bare wildcard syntax (`npm deprecate @package@*`) results in E404 "Not Found" errors and does not persist the deprecation. Use explicit version range syntax instead: `npm deprecate "@package@>=0.1.0" "message"`. This successfully deprecates all published versions without E404.

**Why:** The wildcard approach failed with "Not Found" error even though the package and versions exist in the registry. The version-range syntax uses a normal ranged PUT that avoids this issue.

**How to apply:** For future package deprecations, always use `@>=X.Y.Z` (where X.Y.Z is the earliest published version) instead of bare `@*` syntax. This is more reliable across npm registry quirks.
