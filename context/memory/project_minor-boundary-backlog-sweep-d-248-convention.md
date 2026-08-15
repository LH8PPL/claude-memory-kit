---
id: P-RVaUWFAL
type: project
shape: Timeless
title: Minor-Boundary Backlog Sweep (D-248) Convention
created_at: 2026-07-14T06:34:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 25cedf2ba86944289e4b6449f65ab04e042e5fa4ea75ffa5a0578fcfc64a0243
related: [minor-release-triggers-backlog-sweep, release-trigger-tag-push-publishes, task-queue-organization-naming-convention]
---

- **When**: Runs as part of every minor version release (e.g., v0.5.X cut)
- **Process**: Scan backlog for triggered items
- **Lane rule**: Triggered items → NEXT version; nothing is re-killed or merged into current release
- **Outcome**: Keeps releases clean, queue predictable, no strays or backlog creep

**Why:** Deliberate governance to prevent lost work and accidental scope creep.

**How to apply:** Expect D-248 as a standard release-commit step. When starting v0.5.4+, check what came from the prior sweep and prioritize those lanes first.
