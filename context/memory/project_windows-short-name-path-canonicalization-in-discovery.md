---
id: P-K356XCRP
type: project
title: Windows Short-Name Path Canonicalization in Discovery
created_at: 2026-06-26T11:36:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ebdc42069eb028f3666497faf8cfac822cf06aba9b2339c3b5329be1638d7405
related: [config-directory-migration-is-critical-blocker-for-rename]
---

Path comparisons in discovery walkers failed silently when one side used short names (8.3 format) and the other used full names.

**Example**: `C:\Users\JOHNDO~1\...` vs `C:\Users\john.doe\...` — same path in 8.3 short form vs long form, but a string comparison didn't match.

**The fix**: Use `realpathSync.native` to canonicalize paths before comparison.

**Why:** Without this, project discovery could fail intermittently depending on how cwd was specified (short vs long form), especially on Windows.

**How to apply:** Canonicalize both sides with `realpathSync.native` before comparing filesystem paths from different sources.
