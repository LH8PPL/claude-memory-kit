---
id: P-WJFN7URN
type: project
shape: Timeless
title: Bash() prefix cannot safely express git --index-only operations
created_at: 2026-08-02T07:51:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0b8ebca9fe852e35d7a80a36bcfc15a6679285f140e84ff8f8eda025aacc7da5
related: [cmk-version-bumping-convention, use-deterministic-comparators-for-sorting-committed-files, readme-changelog-update-timing]
---

The `Bash()` prefix pattern lacks safe support for `--index`-only git flags (e.g., staged-only file operations)

**Why:** Affects gateability of certain repairs; operations requiring this pattern cannot be granted

**How to apply:** When git operations need `--index` targeting, avoid `Bash()` prefix; find alternative expression pattern
