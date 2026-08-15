---
id: P-SAGHE2A2
type: project
shape: Timeless
title: 'Release Cut: Tag Version Must Match package.json'
created_at: 2026-07-02T18:57:31Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 99b7fd7fe36afa453a2a198c03e0c3c0bdd3c8764537ea31335f98fddb982d22
related: [release-publish-workflow-git-tag-to-npm, v0-4-3-release-verification-process, tag-and-publish-v0-3-5-release]
---

Tags pushed to remote trigger publish.yml. If tag (e.g., v0.4.3) doesn't match package.json version (e.g., 0.4.4), workflow publishes under wrong version. Verify before push. After push, check `npm view @lh8ppl/claude-memory-kit version` and `gh run list --workflow=publish.yml --limit 3`.

**Why:** Accidental tag/version mismatches trigger unintended publishes to npm.

**How to apply:** Before pushing tag, verify it matches bumped package.json. After pushing, verify with npm view and gh run list to catch mismatches early.
