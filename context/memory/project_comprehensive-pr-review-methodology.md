---
id: P-AYNYAAJD
aliases: [P-AYNYAAJD]
type: project
shape: Timeless
title: Comprehensive PR Review Methodology
created_at: 2026-08-10T11:36:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7277e30be417922d842226fb1194970b237befc6e93fe796e56cab78d32edd5d
---

Each PR verification includes:
- Full diff read
- Test suite pass rate (e.g., `tests/cli-link-backfill.test.js` 18/18 green)
- Validation suite: `validate-docs` (all 5 families) + `validate-exit-doors`
- Live probes: degenerate floor, mixed-edge corpus, dry-vs-apply parity, mid-run corpus growth

**Why:** Catches regressions across logic, docs, edge cases, and corpus-health dimensions

**How to apply:** Use this checklist when reviewing PRs to confirm all four tracks pass before merge
