---
id: P-JRAF6ZV7
type: project
title: Borrowable Ideas from awrshift/claude-memory-kit
created_at: 2026-06-28T18:15:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e45719bc770a2cf98dc8948e75aabc9ca629123addfded734731ead0894304af
related: [three-borrowed-ideas-laned-to-tasks-versions]
---

- **Git-history backfill**: Scan for commit-days missing `sessions/` entries, reconstruct log from git. Fills gap if Stop hook misfires or session crashes. Fits daily-distill cron.
- **Proactive promotion nudge**: Surface patterns meeting promotion criteria, ask user to confirm (current `cmk lessons promote` is user-initiated; awrshift-style would be auto-surfaced).
- **Onboarding tour** (lower priority): `cmk tour` narrates user's actual memory structure, not generic docs. Nice UX but less critical.

**Why:** awrshift/claude-memory-kit is ahead on warmth (tour, proposal phrasing) and has one automation gap (git backfill) we lack. Comparison clarifies our strengths (rigor, automation, npm, breadth) and identifies real feature gaps.

**How to apply:** Roadmap git-history backfill and promotion-nudge as v0.2/v0.4-lane candidates. Onboarding tour is lower priority. Do NOT adopt their manual `/close-day` ritual (violates D-169).
