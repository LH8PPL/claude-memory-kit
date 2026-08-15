---
id: P-RCKKU29L
type: project
shape: Timeless
title: Task Notification and Resumption System
created_at: 2026-07-23T19:02:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce9c349a8e6c55b30f76a773f9a3626caa98f1a2593071e6318800ef81845d58
related: [kiro-cli-v3-delete-guardrail-pretooluse-known-limitation, cmk-install-auto-updates-managed-block-version-stamps, one-line-pointer-design-for-numbering-validator-consistency]
---

Task notifications fire when an agent completes with no live background children. The same task-id can notify multiple times (agent may be resumed). Users can send follow-up messages to continue/resume a paused task.

**Why:** Knowing how the notification system works prevents confusion when a task-id reappears; clarifies that resumption is expected and possible

**How to apply:** When a task-id recurs in a notification, recognize it as a resumption checkpoint; send another message to continue or resume the agent
