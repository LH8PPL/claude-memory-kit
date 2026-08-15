---
id: P-3LaBFBLL
type: project
title: v0.4.3 Release & Verification Process
created_at: 2026-07-01T11:46:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d873bff56fa587943f6405a8b77b14cf13e4a239d4f85b09f04eaf3f90d35c52
related: [tag-and-publish-v0-3-5-release, release-publish-workflow-git-tag-to-npm, release-cut-tag-version-must-match-package-json]
---

Commands (from project root):
```
cd C:\Projects\claude-memory-kit
git tag v0.4.3
git push origin v0.4.3
```

Verification (after publish):
```
npm view @lh8ppl/claude-memory-kit version
```
Should return `0.4.3`. Verify GitHub Release + provenance badge appear.

Baseline: commit `5d34af6`, CI green on main.

**Why:** Exact commands & checks ensure npm + GitHub publish succeed cleanly before next task fires (Task 185 triage).

**How to apply:** Run tag/push verbatim when ready. Verify npm version immediately after push completes.
