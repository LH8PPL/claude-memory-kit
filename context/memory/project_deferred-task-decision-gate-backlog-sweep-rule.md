---
id: P-YT4aa3YD
type: project
title: Deferred Task Decision Gate (Backlog Sweep Rule)
created_at: 2026-07-01T09:07:59Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 84df64b5f28afe33cdbaca1a6f4766007cab50c19f54e360fcb18ac8f8b76d42
related: [task-laning-strategy-and-trigger-discipline, mandatory-trigger-walk-in-d-248-sweep-and-cut-gate-pre-tag, task-management-discipline-d-248]
---

Every deferred task must specify a checkable trigger (not "when ready").
Before each minor release: walk deferred tasks and render verdict (pull in / keep-deferred-with-trigger / kill).
No task survives two consecutive minors without explicit verdict — forces resolution instead of rot.
Scheduled triage pass for all stuck tasks at v0.4.4 cut.

**Why:** User identified a real problem — 18+ tasks since v0.1 still unshipped because "ready" is not testable. This rule adds a forcing function: named triggers + mandatory sweep → prevents indefinite deferral.

**How to apply:** At each minor release cut, walk deferred-task list, check triggers, decide explicitly. No task survives two minors without verdict.
