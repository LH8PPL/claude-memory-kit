---
id: P-BFFBCZ2Q
type: project
shape: State
title: Prior-Art Findings Annotated on Task Entries
created_at: 2026-07-20T14:16:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4521c942a48fe26d26ef48e8d85e48b295ad774c3d0b464f419fb6b8b8bef2cc
related: [project-decision-trail-lane-preservation-habit, session-state-at-pause-2026-07-20-pre-compact-v0-6-0-shipped]
---

- D-374 sweep results annotated directly onto relevant backlog tasks (e.g., Task 184 notes `basic-memory` solved multi-project navigation)
- Prior-art checking moved from build-time per-task to sweep-time whole-backlog
- Annotations placed on tasks so findings reach decision-makers instead of staying in separate logs

**Why:** Separate documentation doesn't reliably surface findings to decision-makers. On-task annotations prevent re-solving known problems.

**How to apply:** Before building a task, read its prior-art annotations. When completing prior-art sweeps, annotate results onto related task entries.
