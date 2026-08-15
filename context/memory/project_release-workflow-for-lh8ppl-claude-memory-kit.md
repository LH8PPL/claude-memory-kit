---
id: P-NRVP5a4V
type: project
shape: Timeless
title: Release Workflow for @lh8ppl/claude-memory-kit
created_at: 2026-07-10T09:50:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d4bb6dc1550181cca1d43327ff7e01144f72d2333bbf5276a26b19f0bc5a5c7d
related: [release-workflow-tag-driven-automation-via-publish-yml, release-workflow-for-claude-memory-kit, release-publish-workflow-git-tag-to-npm]
---

1. Ensure CI tests pass on main branch
2. Verify dogfood memory is committed and screened (name-validator + gitignore compliance)
3. `git checkout main && git pull` — fetch latest including memory commit
4. `git tag v0.5.0` — tag the release (update version as needed)
5. `git push origin v0.5.0` — push tag to origin
6. GitHub Actions workflow `publish.yml` is automatically triggered
7. Workflow runs full test suite, then publishes to npm with provenance
8. Workflow creates GitHub Release from CHANGELOG `[0.5.0]` section

**Why:** Ensures releases are tested, documented, memory-synchronized, and auditable

**How to apply:** Follow this procedure for future releases; update version numbers and changelog accordingly
