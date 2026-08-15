---
id: P-T2DNJQaF
type: project
shape: State
title: Full Gate Re-Run on Final Code After Code Review
created_at: 2026-08-01T18:25:16Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7b5f84fa76f981df3adfe69a8a6043a3750583edd834a6177424ded8464a24e8
related: [stress-gate-requirement-for-spawn-boundary-changes, 5-concurrency-stress-gate-as-pre-pr-verification, validation-gate-chain-and-stages]
---

When code review identifies issues and fixes are applied, the full test sequence re-runs before PR forward: suite → stress 5/5 → live-verify → plus any new live checks specific to the fix (e.g., "reindex clears the whisper"). Confirmed practice after B1/B2/B3 fixes on this PR.

**Why:** Critical paths require end-to-end verification; a unit-test pass may fail under stress or live conditions. New live checks verify the specific fix worked.

**How to apply:** After applying review findings, re-run full gates. Add new live checks that probe the specific problem the fix addressed (e.g., whisper-self-clearing check for B1). Merge only after all gates pass.
