---
id: P-M9P6R5BU
type: project
shape: State
title: v0.5.1 Release — Ready to Tag and Publish
created_at: 2026-07-12T17:51:55Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 035d808dff29715dad3d908c7090c10c80ee50e9da8d616d65780f4454114abc
related: [tag-and-publish-v0-3-5-release, release-workflow-tag-timing-after-gates, v0-5-1-release-pr-282-must-merge-before-tag]
---

- All gate sections pass; release verified and ready for publication
- Local main is behind upstream; must pull before tagging to capture all fixes
- Tagging sequence: `git checkout main` → `git pull` → `git tag v0.5.1` → `git push origin v0.5.1`
- Tag push triggers publish.yml (npm publish + GitHub Release automation)
- Fixes included: Task 222 (install silence), Task 223 (E2 label), CHANGELOG correction

**Why:** Pull synchronizes with upstream; omitting it would tag a stale commit missing Task 222 and CHANGELOG fixes

**How to apply:** Follow sequence exactly. Confirm local main is synced before tagging; automation handles npm and GitHub Release on push.
