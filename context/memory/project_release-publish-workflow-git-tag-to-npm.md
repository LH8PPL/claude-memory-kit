---
id: P-RHaM3HDa
type: project
title: Release & Publish Workflow (Git Tag to npm)
created_at: 2026-06-16T13:07:39Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 87d56bf81e57fa2aea7adfe5dbd566dd38e0b058cbe3d0393af9813e5e3778b4
related: [release-workflow-tag-driven-automation-via-publish-yml, release-workflow-for-claude-memory-kit, release-workflow-for-lh8ppl-claude-memory-kit]
---

1. Tag locally: `git tag v0.3.2`
2. Push tag: `git push origin v0.3.2`
3. Triggers `publish.yml` workflow → runs full test suite → publishes to npm with provenance badge
4. GitHub Release auto-created from CHANGELOG [version] section
Post-publish verification: `npm view @lh8ppl/claude-memory-kit version` (should match tag); npm page shows provenance badge; GitHub Release exists matching CHANGELOG

**Why:** Repeatable, verifiable release process ensures consistency, transparency, and auditability

**How to apply:** Use for all future releases (v0.3.3, v0.4.0, etc.); always complete verification steps before announcing
