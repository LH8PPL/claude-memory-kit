---
id: P-2663WQEX
type: project
title: Committed Roadmap (v0.4.4–v0.5.0)
created_at: 2026-07-02T08:00:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d95e8469b9a6c03fc05db9775edd46cc6b22386362de449c9d551da9bd51d080
related: [post-v0-5-2-roadmap-decision-v0-5-3-or-v0-6-0, v0-4-5-roadmap-task-196-cursor-adapter-task-198-temporal-swe, release-roadmap-v0-5-1-v0-5-4]
---

- **v0.4.4** (next): Task 66 (temporal validity) + riders 150, 141a
- **v0.4.5**: Cursor adapter (demand: friends use it; real users = free live testers)
- **v0.4.6**: Codex adapter + Task 195 (name re-decision checkpoint)
- **v0.5.0**: Learn-loop depth features (tasks 190→193→191→192→194)

**Why:** User prioritized breadth (multi-harness support) over depth (learn-loop); deferred name decision until multi-harness is proven real. Validated by `validate-backlog-triggers` on each `npm test`.

**How to apply:** Use for release planning. After v0.4.6 (Codex live), re-evaluate naming and proceed to v0.5.0.
