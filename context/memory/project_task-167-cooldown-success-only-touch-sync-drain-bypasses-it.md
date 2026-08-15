---
id: P-UPJDK2UN
type: project
title: Task 167 cooldown — success-only touch + sync-drain bypasses it
created_at: 2026-06-25T20:08:28Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 5abf0bc270bae847a1eceeb4ab833eb53ca342b0451cea9afe83daeffaeaad26
related: [cooldown-marker-bug-fires-on-both-success-and-failure, task-167-testing-agent-run-unit-live-agent-loop-user-does-no, were-in-the-memory-business-correctness-over-startup-speed]
---

Task 167 cooldown (Q5, the 167.F sibling bug) settled: (5a) touchCooldownMarker fires on SUCCESS only — never in the catch block — so a failed Haiku call is free to retry (today all 5 callers touch on both success+failure → a failure blocks the next compress 120s). (5b) the stale-content SYNC-DRAIN BYPASSES the cooldown entirely. Rationale: the cooldown is a COST guard ('don't burn Haiku budget twice in 120s'); per 'we're in the memory business' correctness > cost, so when stale now.md must heal, the heal wins over the cost-saver. The cooldown still gates the routine OPPORTUNISTIC compress (no stale content = no urgency = saving budget is fine). Two intents, two rules: cooldown guards the optional compress, NOT the correctness-critical drain.

**Why:** Grilling Task 167 Q5. The cooldown today (touched on success AND failure by 5 callers) both blocks failed-call retries and could block the very stale-content heal Q4 said must happen now. Resolving with the 'we're in the memory business' principle (P-9V3K7KEA): the cooldown is a cost guard, correctness beats cost, so the urgent drain bypasses it while the opportunistic compress still respects it.

**How to apply:** In the compaction paths: move touchCooldownMarker to fire only after a successful compress (remove it from every catch block — compress-session/daily-distill/weekly-curate/auto-extract/auto-persona). In the lazy roll, the stale-content sync-drain path does NOT check isCooldownActive; only the non-stale opportunistic-compress path checks it. Compose with Q4's time-budgeted sync drain.
