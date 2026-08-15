---
id: P-L6DTEQRG
type: project
title: Post-#215 merge workflow (gate continuation)
created_at: 2026-06-21T17:04:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 310dbe368a022bbf8a0ebd445a5d6b6e6997bd67c90f62a5b43ff720360aa1b8
related: [memory-persistence-validation-workflow-end-to-end, verification-gate-two-phase-approach, release-workflow-commit-cut-gate-tag-push]
---

Once #215 merges, the next steps are:

1. Rebuild the artifact
2. Re-verify KG7 passes on the installed binary
3. User performs Session 1 in Kiro (live capture/inject checks)

No action needed until #215 merges; then this is the defined continuation.

**Why:** This is the planned workflow to complete the live-test gate and verify full IDE/CLI integration before release.

**How to apply:** After #215 is merged, follow these steps in order. Session 1 in Kiro requires the user (not the assistant) for live testing.
