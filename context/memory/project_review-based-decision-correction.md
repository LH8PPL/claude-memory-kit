---
id: P-QGXC337T
aliases: [P-QGXC337T]
type: project
shape: State
title: Review-Based Decision Correction
created_at: 2026-08-08T15:27:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0bb19e9ccddff15f45e6aeed82cd1dc71eed1b818ad777494bbad1b57d8f3909
related: [architecture-decisions-recorded-in-adrs, decision-trail-recording-convention-for-divergences, qa-verification-discipline-before-release]
---

When a review identifies incorrect evidence for a decision:
1. Recompute or re-examine the evidence correctly
2. Restate the decision record (e.g., D-436) with the true rationale
3. Document what was wrong with the original evidence
4. Proceed with the corrected decision

**Why:** Maintains audit trail; the next reviewer knows the true reason, not the misattribution. Decisions are only valid with correct evidence.

**How to apply:** When fixing code from a review finding, also correct any decision records with the true evidence and rationale.
