---
id: P-SG2XHQNT
type: project
shape: State
title: 'D-343 disposition: cmk install scaffold-refresh bug → Task 230, v0.5.5'
created_at: 2026-07-15T19:18:23Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 780383ad75d3e5c572267943c009940efce262b1e365f7bd1062665ed17383f8
related: [cmk-install-skip-existing-behavior-and-update-implications, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre, kiro-has-four-install-surfaces-not-three-the-user-s-correcti]
---

D-343 disposition SETTLED: the cmk-install-skips-existing bug (kit-owned scaffold like .claude/skills/ never refreshes on update) is filed as Task 230, laned to v0.5.5 alongside the D-337 security fix. It's a correctness bug (an updated install must reflect the current version), not deferred. Fix: installTier refreshes kit-owned dirs, keeps skip-if-exists only for user-memory tiers; + cmk doctor skill-drift detection. Proven live 2026-07-15 via test-install-refresh.mjs (staleified skill survived a re-install untouched).

**Why:** The finding was captured by auto-extract but the DISPOSITION (Task 230 + v0.5.5 lane) lived only in tasks.md/RELEASE-PLAN, not in the kit's memory — a recall query surfaced the drift between the committed docs and the memory

**How to apply:** Recall via cmk search 'install skip refresh' or --scope decisions; the settled lane is v0.5.5, Task 230
