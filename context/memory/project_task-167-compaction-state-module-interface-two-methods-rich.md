---
id: P-YZQD9K4U
type: project
title: Task 167 compaction-state module interface — two methods rich return
created_at: 2026-06-25T20:04:05Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 4c2b31f2f499465cbf8ad81f78fa12a8fc02ae32c0655ffabae3f9084cd29c9f
related: [compaction-state-module-v0-4-1-core-architecture-refactoring, hc-10-proactive-dead-cron-detection-question-7, architecture-review-priorities-and-the-persona-routing-into]
---

Task 167 compaction-state module — interface settled (Q3): TWO methods. (1) isCompactionNeeded({projectRoot, now, ...ttls}) returns a RICH verdict object {verdict, cronStale, heartbeatAge} — not just yes/no; the lazy roll reads .verdict, cmk doctor HC-10 reads .cronStale/.heartbeatAge. (2) recordCronHeartbeat({projectRoot, now}) — the only writer, the cron bins call it on each fire. No standalone isCronAlive() method — cron-liveness is computed ONCE inside isCompactionNeeded and exposed via the return object, so there is exactly one source of truth and nothing can drift (a 3rd public predicate would be a 2nd place the freshness rule is read from, which drifts — the exact 'two sources disagree' bug class Task 167 fixes). detectStaleness is absorbed into isCompactionNeeded; the cron-registered sentinel + cronSentinelPath retire.

**Why:** Grilling the compaction-state deep module (architecture review #1 = Task 167.A). The fork was 2 methods vs 3 (a standalone isCronAlive). The deep-module principle + the Task 167 bug class itself (two sources of one truth disagreeing) make 2-with-a-rich-return correct: richness lives in the return value, not extra buttons, so there's exactly one place the cron-liveness rule is computed. The user needed the doctor to still get the liveness info — solved by the rich return, not a 3rd method.

**How to apply:** Implement isCompactionNeeded to return {verdict, cronStale, heartbeatAge}. The lazy roll consumes .verdict; cmk doctor HC-10 consumes .cronStale + .heartbeatAge. recordCronHeartbeat is the single writer (cron bins, last act after the work, atomic temp+rename). Do NOT add a public isCronAlive — keep cron-liveness a private step inside isCompactionNeeded so the freshness threshold has one home and cannot drift.
