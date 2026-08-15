---
id: P-DYCCQG9H
type: project
title: 'Release Trigger: Tag Push Publishes'
created_at: 2026-06-17T07:15:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: cf774b13411d738028218e48bfdc5a807fb70f2deea20828cd0b3d1472e0574e
related: [release-workflow-tag-driven-automation-via-publish-yml, release-handoff-pr-creation-vs-merge, user-owns-release-tag-push]
---

Tag push to the repo automatically triggers the publish step. The user (operator) is responsible for pushing the release tag when code is merged and ready; publish automation follows deterministically.

**Why:** Separates user control over release timing from deterministic automation, preventing accidental early releases while keeping the publish step hands-free.

**How to apply:** When a release version (e.g., v0.3.3) is merged and ready to ship, push the release tag to the repo. This will trigger publish automatically.
