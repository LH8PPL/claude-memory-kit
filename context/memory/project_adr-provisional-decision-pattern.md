---
id: P-35SQ5FUA
type: project
title: ADR Provisional Decision Pattern
created_at: 2026-07-01T17:22:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7cb173d89764e9d431c3b46096e7587a57b3104daf96e98d4dadb906b1cfe08e
related: [decision-log-records-validation-outcomes, kit-s-strict-forward-reference-validation, architecture-decisions-recorded-in-adrs]
---

When a decision depends on survey/validation results, write the ADR with Proposed/WIP status and mark key sections (especially Decision) as provisional pending results. This satisfies forward-reference validation while deferring the final outcome judgment. Example: ADR-0017 recorded the thesis durably with "provisional pending the survey" in its Decision section; the final decision updates after validation completes.

**Why:** Allows durable recording of the decision framework while acknowledging that conclusions are data-dependent. Also satisfies the kit's strict validator (which catches dangling references before they're created).

**How to apply:** When writing an ADR with pending validation results, use WIP/Proposed status. Mark relevant sections as provisional. Update to final status after survey/validation completes.
