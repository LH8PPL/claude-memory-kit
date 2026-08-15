---
id: P-MGHR6JCA
type: project
shape: Preference
title: User Owns Release Tag Push
created_at: 2026-07-06T19:13:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 264c7ad32832fed622bd274ed757244e104594507ded427fb96d9c05ea9ab0e4
related: [release-trigger-tag-push-publishes, release-handoff-pr-creation-vs-merge, release-workflow-tag-before-merging-new-work]
---

User is the authority for pushing release tags to origin. This is the final, outward-facing step of releases and remains the user's responsibility, never assistant's. It's a standing rule that separates internal work from external visibility.

**Why:** Clear boundary between development decisions (assistant) and public commitments (user). Prevents unintended early releases.

**How to apply:** On every release cycle, remind user that tag push is their step. Provide the command; never execute it yourself.
