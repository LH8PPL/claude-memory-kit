---
id: P-W75PJXBP
type: project
title: Release Process for claude-memory-kit
created_at: 2026-06-19T18:05:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8ee7e527bc760de477161163ce2c859b349640ac248bf3f3eb405951767d52f1
related: [v0-6-6-release-ready-for-tag, release-workflow-for-lh8ppl-claude-memory-kit, release-workflow-tag-driven-automation-via-publish-yml]
---

The release workflow:
- `npm run release -- patch` — bumps version, updates CHANGELOG [Unreleased] → [X.Y.Z], commits
- Review the diff and commit if needed
- `git push origin vX.Y.Z` — pushes the tag, triggering publish.yml
- publish.yml: runs CI suite, publishes to npm with provenance, creates GitHub Release

**Why:** Ensures consistent, repeatable release process with automated publishing via GitHub Actions.

**How to apply:** When ready to release, run npm release command, review the diff, then git push the tag. The rest is automated. Verify the publish.yml workflow completes before marking release as live.
