---
id: P-PSKLBCG5
aliases: [P-PSKLBCG5]
type: project
shape: Timeless
title: Health Strip Displays Actionable Messages
created_at: 2026-08-03T16:32:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e43d2b90486e8c7154389c16af0d3eee4a1b29a61e7e58fa377e9e08fffd6271
related: [cmk-hook-capture-fails-during-stress-gate, durable-state-first-principle, standard-cmk-installation-command]
---

When in non-ok state, health strip displays clear, actionable feedback. Example: "3 item(s) awaiting review waiting on you — run `cmk queue review`" surfaces the status and the exact command to address it.

**Why:** UX principle: clear state + actionable next step enables users to proceed without re-orientation

**How to apply:** Future state displays should follow this pattern—status description paired with the suggested next command
