---
id: P-2SMZGDNF
type: project
shape: Event
title: v0.5.1 Tasks Filed for Distill and Principle
created_at: 2026-07-08T13:20:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ceceec61af0e71e890849ff3a2adf78dc11c8d8209d91a339ed4ab6b7ba2db3c
related: [d-343-disposition-cmk-install-scaffold-refresh-bug-task-230, v0-5-0-release-feature-complete-l3-promotion-gate-pending]
---

- Task 203: HC-10 must verify `recent.md` freshness; lazy fallback must stop shadowing daily distill; `register-crons` should set `WakeToRun=True`
- Task 204: Principle that long jobs must be incremental + resumable-from-artifacts (prevents repeat in next long job)
- Both filed in `tasks.md`, laned in `RELEASE-PLAN.md` under v0.5.1
- Recorded as D-298/D-299 on main, CI green
- Blocks: none (pre-existing defect, distill works on demand, `recent.md` fresh now)

**Why:** User's insight that "memory just works automatically" was broken by silent distill failure; the principle ensures future long jobs won't repeat it.

**How to apply:** Treat as the first committed work of v0.5.1; refer to D-298/D-299 in code/PRs; use Task 203 as reference implementation of the incremental+resumable pattern.
