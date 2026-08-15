---
id: P-WXP6RC9S
type: project
shape: Preference
title: Project Decision-Trail Lane Preservation Habit
created_at: 2026-07-06T18:15:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 27376cd1ba4b5658ca5304c91c95621d378ca2ddeb19cce9d2e8c3011f4e158a
related: [decision-trail-rule-preserve-decision-history-in-task-entrie, architecture-decisions-recorded-in-adrs, decision-trail-preservation-rule]
---

When advancing a task from one decision/lane to another, preserve the old lane/state in the record rather than overwriting it. Cite the decision-trail rule.

**Why:** Maintains full traceability of how decisions and tasks evolved; supports root-cause analysis and pattern spotting in future refactors.

**How to apply:** When closing, advancing, or re-diagnosing a task/decision: note the old lane/state in the record (e.g., "Old lane preserved per the decision-trail rule"), don't overwrite it.
