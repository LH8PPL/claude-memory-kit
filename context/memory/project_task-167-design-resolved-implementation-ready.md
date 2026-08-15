---
id: P-YGSF2T6T
type: project
title: Task 167 Design Resolved — Implementation Ready
created_at: 2026-06-25T20:48:16Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 088254533d0465e98d97fa3a9bb0255ac8792c4b4efcd8419b7b530ded0994cc
related: [task-167-testing-agent-run-unit-live-agent-loop-user-does-no, task-167-shipped-live-test-overturned-the-grilled-q4-sync-dr, task-completion-workflow-code-test-doc-review-live-test-merg]
---

All 7 grilling decisions (Q1–Q7) are locked and documented:
- Q1: Deep module absorbs verdict (owns `isCompactionNeeded`)
- Q2: Anacron `cron-heartbeat` (gate on age not existence; no per-level marker)
- Q3: `isCompactionNeeded()` returns `{verdict, cronStale, heartbeatAge}` + single `recordCronHeartbeat()` writer
- Q4: Drain synchronously before inject when stale + dead cron; time budget caps sync (correctness > speed)
- Q5: Cooldown touched on success only; sync-drain bypasses cooldown
- Q6: TDD: unit tests (`npm test`) + live-verify scenario (trap state → heal → multi-session prove)
- Q7: HC-10 reframed as dev diagnostic (free WARN log; no prescriptive command)

Implementation: TDD on `compaction-state.mjs` core → 6 sub-tasks → live-verify scenario → two-pass review → v0.4.1 release. Docs updated: tasks.md (DESIGN RESOLVED block), design.md (§8.2.3), HEALTH-CHECKS.md (HC-10), DECISION-LOG (D-207). Validators pass.

**Why:** Core design is final. Unblocks build. Future sessions need locked decisions without re-deriving.

**How to apply:** Build in TDD order. For design questions, consult DECISION-LOG D-207 and Q1–Q7.
