---
id: P-LNK4DKSP
type: project
shape: State
title: Release Workflow — Tag and Automated Publishing
created_at: 2026-07-29T08:11:50Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6b679aaa387b98ffa83d8b3edf419add231ed7843f0f202163a7bcd5840ebc6c
related: [release-workflow-tag-driven-automation-via-publish-yml, release-process-for-claude-memory-kit, release-publish-workflow-git-tag-to-npm]
---

- **Verification step**: All tests must pass end-to-end before proceeding
- **Tagging**: Execute `git tag vX.X.X && git push origin vX.X.X`
- **Automation trigger**: Pushing the tag causes publish.yml workflow to fire
- **Pre-publish verification**: CI re-runs the full test suite as a final check
- **Publishing**: npm package published with provenance (@lh8ppl/core-memory-kit)
- **Release notes**: GitHub Release automatically created from CHANGELOG.md

**Why:** Established automated process that prevents manual publish errors, ensures consistent releases, and maintains an auditable trail

**How to apply:** For the next release, verify tests green, execute the tag command, monitor CI completion; never manually publish or create releases
