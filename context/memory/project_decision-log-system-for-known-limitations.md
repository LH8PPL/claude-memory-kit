---
id: P-6Y2YQaFL
type: project
shape: Preference
title: Decision-Log System for Known Limitations
created_at: 2026-07-02T20:04:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 40dba88d8a5b189b9ca8ed1f76b5b46598869b37c8038faf76de70118472f45b
related: [architecture-decisions-recorded-in-adrs, project-decision-trail-lane-preservation-habit, d-388-project-discipline-document-unreachable-code]
---

The project uses numbered decision-log entries (e.g., D-262) to record decisions about known issues, regressions, and shipping decisions. When a limitation cannot be fixed in-version, the team documents it in the decision log with root-cause analysis and honest disclosure in release notes, rather than leaving it untracked or delaying release.

**Why:** Explicit decision logging ensures regressions are understood, non-obvious constraints are recorded for future maintainers, and stakeholders are informed about known limitations upfront.

**How to apply:** When a known issue persists (e.g., confirmed by restart/reload test), create a decision-log entry with root cause, refine it as new test data arrives, and reference it in release notes before shipping.
