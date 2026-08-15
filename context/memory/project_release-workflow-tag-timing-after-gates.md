---
id: P-AMWUC52V
type: project
title: 'Release Workflow: Tag Timing (After Gates)'
created_at: 2026-06-26T15:34:33Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 806dbe8a42585498da07289a91697cbedd64fb61a94b59ec097b154521f40cb0
related: [v0-5-1-release-ready-to-tag-and-publish, two-phase-release-commit-gate-then-tag-publish, publish-trigger-is-git-tag-push-not-branch-commit]
---

The git tag and push (`git tag v0.4.1 && git push origin HEAD --tags`) happens as the **final** step, only **after** all gates pass. This tag triggers `publish.yml` (npm + GitHub Release), so gates serve as the guard before publishing.

**Why:** Prevents publishing to npm/GitHub until all gates confirm the artifact is sound. Provides a natural rollback point (do not tag if gates fail).

**How to apply:** Follow this order: release → commit (local) → pack/install → backup → scaffold → **run gates** → **only then: tag & push**. Do not tag immediately after release.
