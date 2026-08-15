---
id: P-ZXJTUNVQ
type: project
title: DECISION-LOG Records Validation Outcomes
created_at: 2026-07-01T17:22:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b96bcc676146d3eaf0f18b88d781b6f5a6b405d616bed091a6efc898b293d257
related: [adr-provisional-decision-pattern, architecture-decisions-recorded-in-adrs, decision-logging-in-task-entries]
---

DECISION-LOG entries record the concrete outcomes and choices from major validation work. Example: after a field survey, the entry includes the honest X-of-N denominator (how many systems matched the hypothesis) and the decision made based on results. DECISION-LOG complements ADRs: ADRs describe the framework/thesis; DECISION-LOG records actual data and choices.

**Why:** Separating framework (ADR) from outcomes (DECISION-LOG) allows durable decision logic while capturing the real-world validation data.

**How to apply:** After a survey or major validation completes, write a DECISION-LOG entry with the outcome, supporting data, and any implementation implications.
