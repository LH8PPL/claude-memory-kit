---
id: P-L3X6TPYY
type: project
title: npm run stress — Transient Flake and Fresh-Run Workaround
created_at: 2026-06-30T15:00:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 43de97afae94b41e80bf1782346bac1588d5d8e5282d7805442b6e07c8803900
related: [stress-gate-process-for-pr-merge, stress-gate-requirement-for-spawn-boundary-changes, v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g]
---

**Issue**: Load flake causes mid-run kills (e.g., killed during run-3, run-2 inconclusive). Not a real suite failure.
**Workaround**: Fresh run clears it. No fixed timeout (earlier run had timeout kill). Running 5/5 fresh pass authoritative before merge.

**Why:** Tool quirk affecting pre-merge gate reliability; must rule out false negatives

**How to apply:** If future stress fails mid-run, do not assume real failure—restart with fresh run
