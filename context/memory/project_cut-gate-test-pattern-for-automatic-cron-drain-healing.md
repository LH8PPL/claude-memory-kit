---
id: P-M7CY5H6V
type: project
title: Cut-Gate Test Pattern for Automatic Cron-Drain Healing
created_at: 2026-06-25T20:08:46Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 0a92ca0f6bfb638d2822f943efea9859ce1503b82e9614edaaf8cde364373c64
related: [task-167-testing-agent-run-unit-live-agent-loop-user-does-no, test-hierarchy-for-automatic-path-verification, test-anti-pattern-setup-commands-masking-automation]
---

- **Setup**: Bloated `now.md` + dead-cron sentinel (cron registered, heartbeat stale) — the trap state.
- **Trigger**: SessionStart inject hook only — no manual `cmk compress`/`cmk roll`/drain calls allowed.
- **Binding rule**: Test must NOT call compaction commands directly; doing so masks automatic-path bugs (the D-169 lesson).
- **Assertions**: `now.md` drained, fresh `today-*.md` created, snapshot reflects current state—all triggered by SessionStart alone.

**Why:** The original D-169 bug shipped with green tests because every test pre-ran `cmk compress`, making the automatic path invisible to the test suite.

**How to apply:** When testing automatic systems (cron, session hooks, background processes), use trap state + natural trigger only. Forbid workarounds that would hide integration failures. This catches bugs where the mechanism works but doesn't actually fire automatically.
