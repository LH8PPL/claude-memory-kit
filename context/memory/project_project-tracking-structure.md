---
id: P-K4BM4YYX
type: project
title: Project Tracking Structure
created_at: 2026-06-20T13:35:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4c577c2dd418f5dc47eafa0062d462da2c1889d381081fde558b796c5ad76e87
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, documentation-map-spine-drifts-while-decision-log-stays-curr, current-gate-artifact-v0-5-0-with-task-148-and-sonarcloud-fi]
---

The project uses:
- RELEASE-PLAN: release notes and version notes
- tasks.md: progress tracking (items marked with Task N, stamped when shipped)
- RESUME-HERE: session marker (flipped from current task to next task, e.g., "next = v0.4.0")
- Git history (commits include task IDs, e.g., `30c43fd`)

This allows session continuity: next session reads RESUME-HERE to know what's next.

**Why:** Explicit tracking + session markers let sessions resume without re-deriving state.

**How to apply:** When shipping a feature, update tasks.md, stamp as shipped, flip RESUME-HERE to next task. Next session picks up there.
