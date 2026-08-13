---
id: P-HS56GLKR
aliases: [P-HS56GLKR]
type: project
shape: Absence
title: Windows Worktree Metadata Stale Dirs Cannot Be Pruned
created_at: 2026-08-10T09:51:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: be4a867d9b7ff5bb456f99736012fcc011dc851f42bd1b7f6b9e818da950baa8
---

`git worktree prune` cannot delete stale worktree metadata directories on Windows due to handle retention. This leaves orphaned .git/worktrees/* metadata. Not a regression; a known Windows-specific limitation.

**Why:** Helps with triage and expectation-setting when stale metadata appears. Prevents false-alarm escalation.

**How to apply:** When stale metadata remains, this is expected on Windows. Use `git worktree list` to verify active worktrees and manually inspect .git/worktrees/ if cleanup is needed.
