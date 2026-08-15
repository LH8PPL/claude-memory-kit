---
id: P-LUGG95FY
type: project
title: SonarCloud Hotspot Review — Mark Safe with Comment
created_at: 2026-06-11T21:37:29Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7050d671fa651c16791c1d737dea39e3375bd06b
related: [sonarcloud-then-in-object-false-positive-schema-fields, architecture-decisions-recorded-in-adrs, reference-implementation-alignment-strategy]
---

SonarCloud's hotspot review interface does not offer "Acknowledged" status. For assessed risks (especially negligible exposure in bounded contexts), record the review by marking as **Safe** and commenting with:
- Risk analysis and why it is negligible
- Input/exposure constraints
- Fix timeline (e.g., queued for v0.3.x)

This preserves assessment rationale for future reference and avoids false-positive hotspot debt.

**Why:** Tool limitation requires documented workaround; risk assessment and rationale must be visible to team and future sessions

**How to apply:** When closing hotspots after risk analysis, use Safe + comment pattern instead of searching for Acknowledged status
