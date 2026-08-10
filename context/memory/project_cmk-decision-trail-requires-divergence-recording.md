---
id: P-PZ4LH3CW
type: project
title: CMK Decision Trail Requires Divergence Recording
created_at: 2026-06-18T06:55:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 10034036bf3aaeb1f1a0035864bcf7a9593571078948fc5e9fddd54e6562fe49
related: [decision-trail-recording-convention-for-divergences, decision-trail-rule-preserve-decision-history-in-task-entrie, project-decision-trail-lane-preservation-habit]
---

When implementation diverges from prior research or spec conclusions, the divergence must be explicitly recorded in decision trail (research notes or DECISION-LOG). Include what was proposed, what was built instead, and why. Failing to do this violates the project's decision-trail rule.

**Why:** Traceability and informed review. Future maintainers must know both the original decision and the reasons for change; prevents the same design question from being reconsidered.

**How to apply:** After implementing per research, compare to spec. If diverged, update research note or DECISION-LOG to record divergence and rationale.
