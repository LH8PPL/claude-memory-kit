---
id: P-YQGQC2a5
type: project
shape: Event
title: v0.6.2 Release Approved Before Auto-Recovery
created_at: 2026-07-22T13:00:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 70ff4fb43b471a0ece18bcf969eeff7d26eaa065957821a8b0a4a6b7fe9f1c05
related: [v0-6-2-release-staging-task-248-timing-decision, v0-6-3-lane-execution-sequence-next-session-start, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre]
---

User approved immediate release of v0.6.2 (breaking Node-20 drop), deferring orphaned-tier auto-recovery to v0.6.3. Rationale: install-path code written late in high-error session poses risk; ship the safe bleeding-stopper fix now, build recovery fresh for v0.6.3.

**Why:** v0.6.2 stops new stray tier creation; recovery can wait. Deferring to v0.6.3 keeps cmk install clean and avoids rushing code late in a long, error-prone session.

**How to apply:** Next session: v0.6.2 has been released to npm. Proceed with v0.6.3 focused on install-path auto-recovery (Task 248 reframed; Tasks 247/249 hygiene batch). Design at P-3PWCGWZH.
