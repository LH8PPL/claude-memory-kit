---
id: P-WML7VSB6
type: project
title: 'D-169: No Manual End-of-Day Rituals (Automation-First)'
created_at: 2026-06-28T18:15:48Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: fe8cb4f37f962da7c378899c5b2e9d8830dde2b62e1dce03d9cd757f605539da
related: [cross-project-rules-auto-promote-at-session-end-stop-hook, fixes-must-be-automatic-in-install-upgrade-flow-not-diagnost, tombstone-auto-recall-design-decision]
---

Manual rituals like `/close-day` are forbidden. Capture, distill, and promote must be automatic (cron, Stop hook, backfill) — never depend on human discipline or ritual compliance.

**Why:** Manual rituals are fragile; design should self-correct instead of relying on users to remember to run commands.

**How to apply:** New features requiring user commands should be optional UX, never the critical path. Prefer auto-triggered or scheduled.
