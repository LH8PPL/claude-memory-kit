---
id: P-UMSaR3CZ
type: project
shape: Absence
title: Do Not Reference Unshipped Task Outputs in Config
created_at: 2026-07-21T12:41:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2d84fc36f11e089fb9b2fef072d38a6eda621bcad1c9a85a6b658e98400a7e9f
related: [lane-membership-planned-together-vs-already-there, cmk-daily-distill-scheduled-task-window-popup-at-23-00, kiro-cli-requires-global-chat-defaultagent-because-hooks-are]
---

Do not read unshipped same-lane task deliverables in job configs. Example: job read `node-version-file: .nvmrc`, which Task 240 (unshipped) is supposed to pin. This creates latent failure at scheduled 06:23 UTC run with no PR context to notify. Fixed by matching existing job literals; Task 240 owns the sweep when it ships.

**Why:** Scheduled jobs run without human supervision; config errors don't surface until automation fires, by which time no PR provides context.

**How to apply:** Use only currently-committed config values. Defer structural changes to the task that owns the new value.
