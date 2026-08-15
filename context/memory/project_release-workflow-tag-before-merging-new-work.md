---
id: P-C4RJDCAD
type: project
shape: Timeless
title: Release Workflow — Tag Before Merging New Work
created_at: 2026-07-22T10:49:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 16f61a85b78029f8e2e580d2049f3f0f39e1b33908f4fcbda5a6a5430df76b4f
related: [catch-task-changelog-version-mismatches-pre-release, post-215-merge-workflow-gate-continuation, release-workflow-npm-script-git]
---

This project's release process requires pushing the version tag at the release commit BEFORE merging any new work. If commits are merged between the release commit and the tag push, they will be swept into the wrong version when the tag is pushed, contaminating the release.

**Why:** Ensures CHANGELOG version claims match the actual tagged commits—maintaining release integrity.

**How to apply:** For each release: (1) verify release commit is on main, (2) push tag at that commit, (3) then open the next lane and merge new work. Never merge between release commit and tag push.
