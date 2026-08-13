---
id: P-Y5N7FSAV
type: project
title: Auto-Compact Fidelity Loss Mid-Task
created_at: 2026-06-12T06:20:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6cdf95b3532fb83064522341e1954190e001f81a
related: [version-snapshot-in-recent-md-guards-against-cross-session-a, memory-auto-injection-on-session-start, project-tracking-structure]
---

Session auto-compaction that fires during a task loses context fidelity. This has occurred twice in recent work.

Sessions that continue past natural boundaries (rather than closing and restarting) are prone to compaction mid-task.

**Why:** Fidelity loss forces the next session to re-derive missing context, negating the kit's designed benefit of seamless continuity across boundaries.

**How to apply:** Close sessions at natural task boundaries (e.g., after shipping a release, before starting a new task). The kit's snapshot + breadcrumb mechanism is designed to preserve state across these boundaries.
