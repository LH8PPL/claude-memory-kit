---
id: P-AYR7PHVA
aliases: [P-AYR7PHVA]
type: project
shape: Preference
title: Task Laning Strategy and Trigger Discipline
created_at: 2026-08-05T12:59:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e0c087280563295873fa779658f4697c4be21fe0c59b62ec9b8e87fe5c662397
related: [task-done-goal-explicitness-rule, deferred-task-decision-gate-backlog-sweep-rule, lane-naming-convention]
---

Three categories for task management:
- **Lane to version**: cheap, real, clear-acceptance-criteria tasks → immediate version lane (e.g., v0.6.6)
- **Trigger with sharp condition**: design-pending or decision-heavy tasks → trigger, but condition must be unambiguous ("when X ships", "after research on Y", not vague/open-ended)
- **Ratchet/recurring**: standing tasks worked every release → no version lane by design (e.g., live-test parity)

**Why:** User's core observation is that vague triggers cause deferral and rot. This structure prevents it.

**How to apply:** When triaging, categorize into one of three lanes. For triggers, write a sharp firing condition. Periodically audit triggers to ensure they still make sense and haven't rotted.
