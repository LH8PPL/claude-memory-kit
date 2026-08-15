---
id: P-MTVVY5FT
type: project
title: Cron-Liveness Fix (167.A) Solves Root Problem; Sync-Drain Is Secondary
created_at: 2026-06-26T06:50:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 567d2ec55503e47de7ad2da91f68bd92ccca7d689d9bce5431ee505d184fbc7d
related: [sessionstart-hook-ceiling-constrains-synchronous-operations, cron-liveness-gate-by-heartbeat-age-task-167-a, auto-heal-path-for-v0-4-1-task-167-d-169-binding]
---

- **Original problem:** Dead cron blocks roll indefinitely (compounding forever)
- **Root fix:** 167.A cron-liveness heartbeat age-gate prevents this
- **Q4's secondary goal:** Synchronous drain to stop compounding mid-session
- **Reality:** Once 167.A prevents wrong cron-gate suppression, detached heal-next-session is sufficient; compounding no longer occurs

**Why:** 167.A eliminates the *cause* of the original compounding bug (dead cron blocks roll). This makes synchronous drain (insurance against mid-session compounding) redundant.

**How to apply:** Prioritize shipping the cron-fix (167.A, done) as the root solution. Sync-drain was defensive insurance; once root cause is fixed, rely on detached async healing. Use this to guide option A vs. B vs. C.
