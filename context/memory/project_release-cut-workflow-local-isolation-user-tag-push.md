---
id: P-6BNBXVHK
type: project
shape: State
title: Release Cut Workflow — Local Isolation, User Tag Push
created_at: 2026-07-06T12:02:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 557916403cecec304c708dfbd36d7bd622710cfcfaf8b4f69d2e72b1dc7f3857
related: [release-workflow-npm-script-git, release-gate-workflow-and-final-user-control, release-workflow-for-lh8ppl-claude-memory-kit]
---

Standard release workflow:
1. Run `npm run release -- <VERSION>` locally (generates commit, updates package.json + CHANGELOG)
2. Build tarball from release commit
3. Install and test tarball in isolated sandbox (not dev repo, not user's personal install)
4. Run full gate suite on real tarball
5. If all gates pass, confirm readiness
6. User manually pushes tag: `git tag <VERSION> && git push origin <VERSION>`

**Why:** Real tarball testing catches issues dev repo would miss; isolation prevents accidents; user controls final tag

**How to apply:** For next release, follow exactly; never test on dev repo; never push tags from assistant
