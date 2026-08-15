---
id: P-3PWCGWZH
type: project
shape: State
title: 'Task 248 reframed (the user''s design call, 2026-07-22): the pre-existing-orphane'
created_at: 2026-07-22T13:00:23Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: c3adede362405a48a3af8b0dfd3c236be86e07fdeecad5414765e2d79cb3ec38
related: [fixes-must-be-automatic-in-install-upgrade-flow-not-diagnost, a-health-check-behind-a-command-does-not-surface-a-silent-fa, doctor-health-nudge-corrected-design-2026-07-22-supersedes-t]
---

Task 248 reframed (the user's design call, 2026-07-22): the pre-existing-orphaned-tier fix belongs in the INSTALL/UPDATE flow as an automatic DETECT-AND-RECOVER, NOT in doctor. On cmk install/upgrade, the kit scans for stray context/ tiers below the root, RECOVERS their facts into the root tier automatically (byte-identical copy, dates preserved — the same move done by hand for this repo), and reports what it moved; it does NOT auto-delete the husk (deleting memory is the user's step per the guardrail + ADR-0018). Doctor detection is DEMOTED to a secondary backstop — a component of the fix, never the fix itself. Deferred to v0.6.3 deliberately: 246 (in v0.6.2) already stops NEW strays, so once a user is on v0.6.2 their old strays are FROZEN and safe (nothing added, nothing lost) — recovery is not time-critical; and it touches the INSTALL path (highest-stakes surface), which deserves a fresh focused session, not the tail of a long one.

**Why:** The kit's philosophy (D-85/D-164/D-169) is automatic-not-manual: a fix that only surfaces when a user RUNS doctor is the invisible-until-you-run-a-command failure the kit fights. The actual repair must be automatic at the upgrade moment; doctor only backstops.

**How to apply:** v0.6.3 headline. Build: cmk install detects nested context/ tiers (the Task-246 scan distinguished real strays from template scaffold by absence of a live now.md/INDEX.md), recovers facts additively into root, reports, leaves husk + a delete hint. Doctor check = secondary. Test with a real planted stray fixture.
