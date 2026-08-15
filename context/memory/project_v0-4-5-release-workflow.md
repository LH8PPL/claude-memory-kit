---
id: P-DMSLASHK
type: project
shape: Event
title: v0.4.5 Release Workflow
created_at: 2026-07-06T10:45:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 94f294f159d1337a60ebdbb0096f21a9c88ac40ebce3a286704b42a99335303e
related: [release-workflow-for-claude-memory-kit, v0-3-1-release-final-workflow, release-gate-workflow-and-final-user-control]
---

1. Merge PR #257 (Task 201 — split-brain backend)
2. Assistant runs `npm run release -- 0.4.5` (CHANGELOG finalization, package.json bump, auto-commit)
3. User pushes `v0.4.5` tag (triggers publish.yml → npm publish + GitHub Release)

Both Task 200 (PR #256, D-270 backend fix) and Task 201 (PR #257, split-brain backend) are merged into main, ready for v0.4.5.

**Why:** Separation of concerns: assistant automates release mechanics; user retains explicit control over publish trigger. Prevents accidental publishes.

**How to apply:** When cutting v0.4.5, execute these steps in order. For future releases, follow the same pattern.
