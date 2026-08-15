---
id: P-7T2BCHL6
type: project
title: 'Release Workflow: Commit, Cut-Gate, Tag-Push'
created_at: 2026-06-16T06:43:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5d3a5bf8198250f024f975f3fd25ab6993f18c2d67b839b35334f87f0d1e7445
related: [release-cut-workflow-local-isolation-user-tag-push, release-workflow-for-claude-memory-kit, release-workflow-after-fix-merge]
---

Releases follow this three-step process:
1. **Commit release prep** — commit message `release: vX.Y.Z`, push to main (can be delegated to assistant)
2. **Build artifact & run cut-gate** — build with `npm pack`, run manual verification using the cut-guide (user-owned, hands-on step)
3. **Tag-push to publish** — `git tag vX.Y.Z && git push origin vX.Y.Z` (user-owned, final outward step)

All steps follow the release guide (§0 onward). Tag-push publishes to npm/registry.

**Why:** This is the repeatable release process. Capturing the workflow and ownership boundaries avoids re-deriving at the next release.

**How to apply:** For the next release, follow all three steps in order. Only commit (step 1) can be delegated; cut-gate and tag-push (steps 2–3) stay user-owned.
