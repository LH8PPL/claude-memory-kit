---
id: P-ZSZa2P7P
type: project
shape: Timeless
title: Release Workflow Sequence
created_at: 2026-08-02T19:11:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 891ceed8734ab0fc4eed504304c712723f5071215b6a43c903b8b2fb9945d7c5
related: [v0-6-4-release-workflow-and-task-ownership, v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g, release-workflow-after-fix-merge]
---

After gates pass and merge is approved, a queued sequence executes in order:
1. Memory-tier flush
2. Closure of initiative 258 onto main
3. npm-ci-retry PR creation
4. v0.6.4 release prep (up to but NOT including tag creation)

**Why:** This is a choreographed, multi-step release process with implicit ordering. Tag creation is deferred as a separate final step.

**How to apply:** After gates pass and merge is approved, execute in sequence without reordering. Do not create the version tag in step 4 — that is a separate final action after this sequence.
