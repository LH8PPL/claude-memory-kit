---
id: P-LTPJG9K5
type: project
title: Release Command Sequence for npm Packages
created_at: 2026-06-30T20:23:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f23d0bac0ee4c7d3609fe25afc5c2be9ff2b247074018f66ebce1449966f8b58
related: [release-workflow-full-sequence-for-v0-4-3-and-future-cuts, release-workflow-and-commands-for-production, release-workflow-npm-script-git]
---

The repeatable workflow to publish a release:
```powershell
git checkout main; git pull
gh pr create --base main --head <branch> --title "<title>" --fill
gh pr merge --squash --delete-branch
git pull
npm run release -- <semver>           # local only, updates CHANGELOG + package.json
git add CHANGELOG.md packages\cli\package.json; git commit -m "release: <version>"
git push origin main
git tag <version>; git push origin <version>  # publish step
```
After tag push, run cut-gate against the published tarball.

**Why:** This is the standard release workflow for claude-memory-kit; next releases (0.4.4, 0.5.0) will follow the same pattern.

**How to apply:** Use this as a template for future releases. The `npm run release -- <semver>` command is local-only; the tag+push is the actual publish point.
