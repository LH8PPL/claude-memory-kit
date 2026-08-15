---
id: P-FTHBGA6H
type: project
shape: Timeless
title: 'Release Workflow: Validation, CHANGELOG Consistency, Tag, and Publish'
created_at: 2026-07-12T17:38:18Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9199acf313de0d328ca9dadad707966ff3d5e9e34f48db43c2434c64ef88a2ee
related: [release-gate-workflow-and-final-user-control, release-workflow-for-lh8ppl-claude-memory-kit, v0-5-1-release-ready-to-tag-and-publish]
---

The release process for vX.Y.Z is:
1. **E3 validation** — Run a failure-bearing test turn in the cold-open Claude Code session to verify the judge system fires correctly
2. **Task/PR coverage** — Ensure CHANGELOG `[X.Y.Z]` section lists all tasks and PRs included in the release
3. **Consistency fix** — If a task changes behavior, correct any outdated CHANGELOG entries that reference it (e.g., v0.5.1: Task 222's fix made Task 205's "warns and offers to stop" claim false; corrected before tagging)
4. **Local sync** — `git checkout main; git pull` to fetch all commits and PRs that landed after the release branch was created
5. **Tag** — `git tag vX.Y.Z`
6. **Publish** — `git push origin vX.Y.Z` triggers `publish.yml` → npm + GitHub Release

**Why:** Ensures release artifacts reflect the actual code and behavior; prevents tagging stale commits; avoids inconsistent documentation

**How to apply:** Follow this workflow when cutting a release, especially if tasks landed after the release commit but before tagging
