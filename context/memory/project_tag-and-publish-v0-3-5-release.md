---
id: P-Ta2YJJaB
type: project
title: Tag and Publish v0.3.5 Release
created_at: 2026-06-20T11:27:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: efa58b4bab1598a89038ece11acaec9a895d8ccb5ae83c60c8c3b82984246702
related: [v0-4-3-release-verification-process, v0-6-6-release-ready-for-tag, release-publish-workflow-git-tag-to-npm]
---

From C:\Projects\claude-memory-kit:
```powershell
git tag v0.3.5
git push origin v0.3.5
```
Triggers publish.yml: suite run + npm publish (with provenance) + GitHub Release auto-generation.

After publication, reinstall locally:
```powershell
cmk install --with-semantic
```

**Why:** Release commit b4ecf78 is on main and ready; tagging is the publish gate that automates npm and GitHub release

**How to apply:** Tag when ready to ship; ensures global cmk gets the new version after npm publishes
