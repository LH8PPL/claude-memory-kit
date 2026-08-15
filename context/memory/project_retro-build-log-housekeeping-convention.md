---
id: P-AY4Sa7DT
type: project
shape: Timeless
title: Retro/Build-Log Housekeeping Convention
created_at: 2026-07-13T13:54:10Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 305be0928ee7f805f257b5fb58b12187bfc8612348bfe8b71da907dd11e5409f
related: [dogfood-decisions-md-committed-post-merge-not-with-feature-p, claude-memory-kit-v0-4-3-release-workflow, flush-memory-to-main-before-creating-feature-branch]
---

Retros, build-logs, and similar development artifacts are stashed during PR review and applied directly to main *after* merge, rather than committed pre-merge. This pattern keeps CI clean during review and consolidates release documentation on the merge commit.

**Why:** Separates artifact commits from code review; ensures release notes land on the merge commit, not lost in the PR history.

**How to apply:** When finalizing a release PR — stash retro/build-log → squash-merge PR → pull main → pop stash → commit artifact directly to main.
