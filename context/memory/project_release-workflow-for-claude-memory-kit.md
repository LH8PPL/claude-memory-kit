---
id: P-CATHYC5L
type: project
title: Release Workflow for claude-memory-kit
created_at: 2026-06-17T07:32:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4d44dc9d94a76f2348daa18df4843e259ec22770d47f9587b2274340f278dfe9
related: [release-workflow-for-lh8ppl-claude-memory-kit, release-publish-workflow-git-tag-to-npm, release-workflow-tag-driven-automation-via-publish-yml]
---

1. Assistant merges all task PRs, updates CHANGELOG and package.json version
2. Assistant creates release commit (`release: vX.X.X`) and pushes to main
3. **Explicit handoff:** User runs `git tag vX.X.X && git push origin vX.X.X`
4. CI workflow (publish.yml) automatically triggers: runs full suite → publishes to npm with provenance → creates GitHub Release from CHANGELOG section
5. Assistant monitors CI automatically (no user request needed)

**Why:** This is the established pattern for shipping claude-memory-kit releases. v0.3.3 is the current example. The tag push is the critical "outward step" where work transitions from local to external/public.

**How to apply:** When staging a release, complete all code (merges, CHANGELOG, version bump), commit, and push to main. Explicitly pause at tag push and hand to user. Monitor CI automatically afterward.
