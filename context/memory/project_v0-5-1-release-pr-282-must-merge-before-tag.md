---
id: P-FA4TG5JS
type: project
shape: Plan
title: 'v0.5.1 Release: PR #282 Must Merge Before Tag'
created_at: 2026-07-12T12:23:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 905f305c12aa771a5d9dcdd66c579be6220c82fe13f41d655156dcf325b13204
related: [v0-5-1-release-ready-to-tag-and-publish, tag-and-publish-v0-3-5-release, release-workflow-after-fix-merge]
---

PR #282 (Task 222 install-prompt fix) must merge to main before tagging v0.5.1. State after merge: code on main, docs updated (cut-gate, CHANGELOG, QUICKSTART, RELEASE-PLAN, build-log, DECISION-LOG, tasks), release commit (a97a485) staged. Final step: `git tag v0.5.1 && git push origin v0.5.1` (user-initiated).

**Why:** Ensures v0.5.1 release artifact includes the Task 222 fix (without merge, tag would ship older build)

**How to apply:** When ready to release, confirm #282 merged, then run tag steps
