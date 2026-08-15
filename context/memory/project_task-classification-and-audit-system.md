---
id: P-LRB6JNQM
type: project
shape: State
title: Task Classification and Audit System
created_at: 2026-07-18T13:59:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e2f14ba91e76b03a2b7a16ee4fef407d6eba51b3e24390be1727e6f639ccdca1
related: [task-laning-strategy-and-trigger-discipline, cmk-version-bumping-convention]
---

All tasks are classified as one of two types:
- **Laned to a version** — assigned to a specific release (e.g., v0.6.0, v0.7.x)
- **Trigger-based** — activated when external conditions fire

An audit process ("the auditor") reviews all tasks and outputs:
- A structured table of all task classifications
- An action list with three result categories:
  - **Fired triggers** — conditions that have activated; require verdict re-evaluation
  - **Stale lanes** — version assignments requiring refresh
  - **Closure candidates** — tasks whose blockers are resolved (e.g., Task 224 after D-350 fix)

**Why:** The project uses mixed versioning and event-driven sequencing. Regular audits keep task-to-lane mappings and trigger states synchronized with reality.

**How to apply:** Use auditor output to re-verdict activated conditions, refresh outdated lane assignments, and close eligible tasks.
