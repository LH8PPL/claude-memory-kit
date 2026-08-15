---
id: P-6AW7LDQH
type: project
title: v0.3.2 Release Scope Locked
created_at: 2026-06-16T04:42:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: efea1b4c27443a23907654ecb3623a6f42a09dd443b22b517052fb10adf15943
related: [v0-3-2-release-status, v0-3-2-release-scope-and-141b-gate, v0-3-2-scope-locked-strict-task-order-discipline]
---

- **Version:** 0.3.1 → 0.3.2
- **Merged + shipped:** Tasks 153 (FTS5 query sanitization / mk_search crash), 152 (validate-index-completeness), 147 (cmk digest + append-only DECISIONS.md), js-yaml security fix, README rewrite, CONTRIBUTING.md
- **Rejected:** 141b (perf regression)
- **Status:** Ready to cut; CHANGELOG [Unreleased] entries prepared

**Why:** All planned tasks completed; 141b rejected on clean data. Release is unblocked pending manual tag push.

**How to apply:** Next: user runs `npm run release -- patch` (review diff) → pushes v0.3.2 tag → publishes. No code changes needed.
