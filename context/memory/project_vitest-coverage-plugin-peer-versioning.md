---
id: P-QFMMQCCa
type: project
shape: State
title: Vitest + Coverage Plugin Peer Versioning
created_at: 2026-07-14T14:59:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 54e3ae754622eaa3757ee600b82c212ea416f4d3d894ac5e41866bfa0b0c91c0
related: [js-yaml-critical-path-in-memory-system, cmk-version-bumping-convention]
---

`vitest` and `@vitest/coverage-v8` are peer-versioned (both 4.1.9)
Must merge together, never separately
Separate merges risk coverage/runner version mismatches causing CI breaks

**Why:** Misaligned versions break coverage reporting or test execution

**How to apply:** Consolidate Dependabot PRs for these two locally; use `npm update vitest @vitest/coverage-v8` to sync
