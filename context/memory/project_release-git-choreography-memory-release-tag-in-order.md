---
id: P-Pa5RBNQ4
type: project
title: 'Release Git Choreography: Memory, Release, Tag (in order)'
created_at: 2026-06-11T07:20:59Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fd243c3e6660a1dcb53aa26f2b5c758134cc004a
related: [release-cut-workflow-for-claude-memory-kit, release-workflow-npm-script-git, release-cut-workflow-local-isolation-user-tag-push]
---

When releasing, three git operations must execute in sequence:

1. Memory churn: `git add context/MEMORY.md context/memory/` → commit
2. Release files: `git add CHANGELOG.md packages/cli/package.json` → commit
3. Tag and push: `git tag v0.3.0 && git push origin HEAD --tags`

This separates ongoing memory artifacts (auto-extracted during dev) from versioned release artifacts. Tag creation always follows all validation passes (per cut-gate.md).

**Why:** Keeps the tree clean; release commits reflect versioning, not session metadata. Memory churn is incidental to development, not part of the release artifact.

**How to apply:** Follow cut-gate.md checklist, then execute this three-step git pattern. The npm run release -- minor script generates both memory and release diffs; stage and commit them separately.
