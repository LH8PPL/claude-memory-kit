---
id: P-W7B3A3FK
type: project
title: Task 167 - Lazy Roll Robustness Extension (v0.4.x)
created_at: 2026-06-25T13:44:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3352e759142d1e0a3809f83c2af7b7ecf7f451b568cd11037bac7d3c2cdd70d5
related: [now-md-bloat-creates-silent-failure-trap-in-lazy-roll, auto-heal-path-for-v0-4-1-task-167-d-169-binding, a-health-check-behind-a-command-does-not-surface-a-silent-fa]
---

**Scope:** Extend Task 105 (lazy `now.md` → `today` roll) to handle large sessions and prevent bloat traps.
**Includes:** size-triggered roll, bounded compression, sync catch-up, observability, cmk doctor health-check command.
**Lane:** v0.4.x (next version).
**Bundling:** Per user request, bundled with Task 105 and 106 in the release plan.
**Status:** Filed, laned, not yet implemented.

**Why:** Task 105 works reliably at ~10 KB scale, but fails silently at 400+ KB. Task 167 extends the mechanism to be robust at scale.

**How to apply:** For the v0.4.x implementation session, treat Task 167 as the primary fix; Task 105 is already complete. Reference D-205 (symptom) and D-206 (root cause) in the decision log for diagnostic context.
