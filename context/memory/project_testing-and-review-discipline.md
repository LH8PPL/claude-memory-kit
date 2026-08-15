---
id: P-CHPEXFAL
type: project
shape: Timeless
title: Testing and Review Discipline
created_at: 2026-07-12T04:14:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d950748e4a8c2f1ce451e97f1598bed03970d4a147758926f311357ebd8d6b6e
related: [full-gate-re-run-on-final-code-after-code-review, review-based-decision-correction, stress-test-gating-rule-for-pr-approval]
---

All PRs undergo full discipline: red-first tests (fail first, then fix), two-pass review, and concurrency stress tests on any surface with concurrent writes (5/5 first invocation). Failures and audit-premise errors are recorded honestly with full rationale (e.g., D-321: audit assumed bug that better-sqlite3 already handles).

**Why:** Ensures both quality and institutional knowledge. Honest recording of failed assumptions prevents repeating mistakes and builds trust in decision records.

**How to apply:** When submitting a PR: write red-first tests, request two independent reviews, stress-test concurrency surfaces, document interesting failures transparently.
