---
id: P-ZMRE4MSU
type: project
title: 'Cascade-Starvation: Lazy Distill Limitation on Busy Repos'
created_at: 2026-06-20T07:50:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 99af8fe020ba59a1c1df44239a8895849b7fd855a72fff171b0e29e1500be149
related: [cmk-health-check-status-2026-06-20, cron-job-registration-feature-hc-5, sessionstart-lazy-fallback-shadowed-by-cascade-starvation]
---

The `detectStaleness` verdict cascade returns only the highest-precedence verdict per cycle. On busy repos (where now.md keeps refilling each session), verdict is stuck at `stale-now`, blocking lower-precedence verdicts (`stale-daily`, `stale-weekly`) from triggering. This prevents multi-level compression refresh cycles, causing recent.md to silently go stale over days.

**Why:** Known limitation (Task 105/D-75). Surfaces as unexpected staleness on high-activity projects. Lazy SessionStart fallback is insufficient as *sole* distill mechanism for hierarchical compression.

**How to apply:** Best fix: register cron for scheduled background distill. Document the limitation clearly. Consider improving detectStaleness to permit lower verdicts in parallel, or file as formal bug for future resolution.
