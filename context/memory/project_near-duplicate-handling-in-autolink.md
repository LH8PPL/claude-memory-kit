---
id: P-Z5RNAJ9X
aliases: [P-Z5RNAJ9X]
type: project
shape: Timeless
title: Near-Duplicate Handling in Autolink
created_at: 2026-08-10T10:45:46Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a44bf3c03fedcafa40e12e653a88bb6cc6146db942b9bbde98251bb22a7654f3
related: [codeql-action-workflow-bumps-held-by-standing-rule, tombstone-auto-recall-design-decision, never-hand-edit-memory-rule]
---

The autolink process identifies near-duplicates but deliberately does NOT auto-merge them. Near-duplicates are marked as "not linked" and held for human review and decision.

**Why:** The backfill system preserves decision-making authority by never automatically queuing merges.

**How to apply:** Treat autolink-identified near-duplicates as flagged-for-review. Review and decide merges manually.
