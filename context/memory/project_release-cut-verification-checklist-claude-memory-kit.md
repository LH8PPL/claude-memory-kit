---
id: P-GWQBHT2H
type: project
title: Release Cut Verification Checklist (claude-memory-kit)
created_at: 2026-06-21T14:38:25Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 2c2bf0750866c4355d35a04d7fc4398236167b823d0b1687e177878c4a63f880
related: [release-workflow-npm-script-git, release-script-correctly-bumps-version-0-hrfkjppc, v0-4-1-release-gate-workflow]
---

After running `npm run release -- minor`, before committing, verify all four points in `git diff`:
  - Version bumped 0.3.5 → 0.4.0 (minor bump, not patch)
  - CHANGELOG: [Unreleased] folded cleanly into `## [0.4.0] — <date>` with fresh empty [Unreleased] reset
  - packages/cli/package.json bumped in lockstep with root version
  - No stray files (only version/changelog changes should appear)

**Why:** Prevents version-drift bugs and ensures clean release artifacts

**How to apply:** After `npm run release -- minor`, run `git diff` and verify all four points before committing and pushing
