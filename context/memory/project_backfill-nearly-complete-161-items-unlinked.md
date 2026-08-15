---
id: P-VT6JJT4A
aliases: [P-VT6JJT4A]
type: project
shape: State
title: Backfill Nearly Complete — 161 Items Unlinked
created_at: 2026-08-15T08:03:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d1a6aeafe90f79b6c1fce9891153550f2b0bcc4c5a5b0690cb2687caa22d69ee
related: [backfill-s-terminal-step-cmk-autolink-apply, durable-state-first-principle, 356-dispatch-agent-killed-fix-batch-does-not-auto-start]
---

- Remaining work: one `cmk autolink --apply` run
- Current state: 161 unlinked items on graph ("unlinked, not drawn: 161")
- Expected outcome: completes all backfill

**Why:** Backfill is the final operational blocker before corpus is fully indexed

**How to apply:** Run `cmk autolink --apply` on next session when backfill is prioritized
