---
id: P-MY66RUPW
type: project
title: Documentation Architecture — Authoritative Files and Verification Checklist
created_at: 2026-06-30T07:21:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5cb7b5d768f5ca55a38f106f2311493951fe89aad9590c6d69276886fb833741
related: [pre-release-documentation-audit-checklist, documentation-map-spine-drifts-while-decision-log-stays-curr, paper-trail-convention-tasks-md-as-single-source-of-truth]
---

The project maintains 8 authoritative documentation files that must be verified & updated during feature shipping:

- **tasks.md** — Task checkboxes + dated ship notes (format: `[x]` + date per subtask)
- **DECISION-LOG.md** — Dated design decisions, newest entries at top (current: D-232, D-233, D-234)
- **design.md** — Design narrative with versioned sections (e.g., §19.2, §20.2, §20.3), marked "Built (151.x)" when shipped
- **ADR-0016** — Architecture decision record (currently 8 references)
- **research note** — Grounding for key design findings (e.g., single-axis-sweep=bug rationale)
- **RELEASE-PLAN.md** — Task-to-release lane mapping (v0.4.3 lane already includes Task 151)
- **HEALTH-CHECKS.md** — Self-healing failure modes (e.g., HC-4 for index health)
- **CHANGELOG.md** — `[Unreleased]` section with user-visible effects (most often missed file; internal mechanisms still get user-visible entries)

**Why:** Complete doc trail prevents shipping with missing context. CHANGELOG is particularly easy to miss when features are mostly internal mechanism, but recurrence promotion + persona persistence ARE user-visible.

**How to apply:** Use this checklist as part of the merge verification gate. The verify-not-assert approach (checking each file rather than assuming) catches gaps like the CHANGELOG was missed here.
