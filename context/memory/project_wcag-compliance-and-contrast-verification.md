---
id: P-WVVMCW99
aliases: [P-WVVMCW99]
type: project
shape: Timeless
title: WCAG Compliance and Contrast Verification
created_at: 2026-08-06T05:38:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c4099aeb2c3f2bbf2783aa58b9cc6f36d6b35e8d48ca82f48d9d7de97d5cddb7
related: [sonarcloud-coverage-gate-threshold, release-workflow-tag-before-merging-new-work, cut-gate-validation-includes-paraphrase-recall-check]
---

The project maintains WCAG compliance through active review checks. New colour changes, especially in dark colour spaces, must be verified for contrast ratios. Current minimum passes 4.88:1 at the thinnest text/background pairs. Test coverage includes all six text/canvas pair combinations.

**Why:** Ensures accessibility compliance and catches regressions.

**How to apply:** When adding or changing text or background colours, verify contrast ratio meets the project threshold (currently 4.88:1). Include WCAG contrast checks in review before merge.
