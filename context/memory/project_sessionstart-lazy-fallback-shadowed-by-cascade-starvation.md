---
id: P-KCFJ4GYT
type: project
shape: Absence
title: SessionStart Lazy Fallback Shadowed By Cascade-Starvation
created_at: 2026-07-08T12:43:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c8df766a75962aebe82b466dd38f3915e73832314ecf84b010a0bded353aac6c
related: [cascade-starvation-lazy-distill-limitation-on-busy-repos, cron-job-registration-feature-hc-5, cmk-health-check-status-2026-06-20]
---

SessionStart floor designed to trigger daily distill if cron fails (D-105 mitigation). On busy repo, "stale-now" verdict permanently shadows "stale-daily", so fallback only does session roll, never daily distill.

**Why:** Second safety net is broken — system has no backup when nightly cron dies

**How to apply:** Modify lazy roll to also trigger daily/weekly distill, not just session roll; unblock cascade-starvation (D-105)
