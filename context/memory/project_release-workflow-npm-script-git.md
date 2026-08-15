---
id: P-A7K5HNM7
type: project
title: Release Workflow (npm script + git)
created_at: 2026-07-01T04:42:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0420922f92fbd0e5eea360ab786c07b47cec6a5d613f751e8a593e1779cc90b6
related: [two-phase-release-commit-gate-then-tag-publish, release-cut-verification-checklist-claude-memory-kit, release-workflow-and-commands-for-production]
---

1. Run `npm run release -- <patch|minor|major>` (auto-updates CHANGELOG.md and packages/cli/package.json)
2. Review `git diff` (should show only version bump + CHANGELOG)
3. `git add CHANGELOG.md packages/cli/package.json`
4. `git commit -m "release: v<X.Y.Z>"`
5. `git push origin main` (or tag with `git tag v<X.Y.Z> && git push origin HEAD --tags` to trigger CI publish)

**Error recovery:** If version bumped wrong, use `git revert --no-edit <hash>` (safe; no force-push), then re-run release script with correct flag.

**Why:** Script automates CHANGELOG + version management (prevents manual errors); reverting (not force-push) is safer for pure version-bump commits on main.

**How to apply:** Follow these steps for next release; verify diff before committing; if wrong version, revert and re-run with correct flag.
