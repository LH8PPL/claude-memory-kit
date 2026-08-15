---
id: P-XS5QEL2G
type: project
title: Silent Auto-Drain + Optional Warmth Design Pattern
created_at: 2026-06-28T18:31:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8a04adf3b19745505082ff01442d53dc8ab5b31f98c5bbdf4130c9fb380e6f4c
related: [test-anti-pattern-setup-commands-masking-automation, three-borrowed-ideas-laned-to-tasks-versions, task-done-goal-explicitness-rule]
---

For auto-promotion and similar features, the pattern is: silent default (runs without user orchestration, per D-169), plus optional warmth (e.g., an in-conversation "I promoted X" mention). This avoids both manual-ritual overhead (their anti-pattern) and silent opacity.

**Why:** Combines external warmth (proposing promotions) with internal automation philosophy (no manual trigger required). Tested decision: D-169 forbids manual rituals; optional mention adds transparency without gating.

**How to apply:** When adding cross-project features, default to silent auto-run. If warmth/approval is needed for UX, add as optional mention or query, not a gate or command.
