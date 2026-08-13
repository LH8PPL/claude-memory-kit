---
id: P-ZEPMTUMP
type: project
shape: Event
title: captureTurn PII masking and transcript ordering fix
created_at: 2026-07-09T07:29:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b40ffae94fbfc1e7c511c162d254b1b6f3bbbccec2f395cac95125f6abb5c45c
related: [d-303-fixed-kiro-auto-extract-user-prompt-empty-recovered-fr, skill-review-imported-facts-staleness-bug-fixed, fixed-bugs-in-task-50-kiro-console-flash-branch]
---

`captureTurn` updated to prefer `payload.user_message` from Kiro Stop hook, apply identical PII masking as assistant turn, and write transcripts in user→assistant order.

Issues identified and resolved:
- PII-masking asymmetry (from self-review)
- B1 (transcript data-loss, from code-review)

Test result: 2829/2829 passing; PR staged.

**Why:** Ensures transcript correctness and consistent PII masking in the stop-hook capture system.

**How to apply:** Reference when modifying capture logic, transcript handling, or PII masking in the hook system.
