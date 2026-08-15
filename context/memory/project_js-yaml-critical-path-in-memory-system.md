---
id: P-K9XFPMSB
type: project
shape: State
title: js-yaml Critical Path in Memory System
created_at: 2026-07-14T14:59:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d93e218fa5ea9a00986e2eda68e974dc9e54c683be1b66cde839bc7a8749f479
related: [version-0-5-4-tarball-ready-for-gate-testing, vitest-coverage-plugin-peer-versioning, release-cut-workflow-local-isolation-user-tag-push]
---

Version: 4.2.0 (in package-lock.json)
js-yaml parses/writes frontmatter for all context/memory files
Any version bump requires `npm test` + `npm run stress` validation against current main

**Why:** Frontmatter parsing is core to memory I/O; regressions break context persistence

**How to apply:** Never merge js-yaml Dependabot PRs on stale CI; verify locally with full suite
