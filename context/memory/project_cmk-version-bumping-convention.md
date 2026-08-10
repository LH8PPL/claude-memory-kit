---
id: P-RPaCVQAN
type: project
title: CMK Version Bumping Convention
created_at: 2026-06-21T16:05:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: afd458e433769f2b3f0904f5eb6195cf0ba5bfea5a81581169847ee450f9859e
related: [stress-gate-release-workflow, tool-quirk-cmk-pack-uses-committed-tree-version, better-sqlite3-pinned-to-13-0-1-not-13-0-0]
---

Bug fixes and content changes do NOT bump the version — the version remains the same (e.g., stays 0.4.0) when rebuilding after fixes.

**Why:** Version increments only for feature releases or breaking changes; bug fixes are part of the same release

**How to apply:** When rebuilding the binary after a fix merge, use the existing version number
