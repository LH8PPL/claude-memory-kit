---
id: P-EJP5KTP3
type: project
title: Cooldown Marker Bug — Fires on Both Success and Failure
created_at: 2026-06-25T20:06:42Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b7903a57a6590756e00611a6f99d6278c7388b2968ecf3703af6df18e97fb5e7
related: [task-167-cooldown-success-only-touch-sync-drain-bypasses-it]
---

`touchCooldownMarker` currently fires on both success and failure from 5 callers, causing failed Haiku calls to incorrectly block the next compress for 120s even though they didn't spend budget.

**Why:** This is the 167.F sibling bug discovered in audit. Failed calls shouldn't trigger cooldown blocking since they didn't consume resources and should be allowed to retry.

**How to apply:** When reasoning about cooldown design and the stale-content sync-drain, remember the current behavior blocks retries after failures. The proposed fix (5a) is to touch the marker only on successful compresses, never in catch blocks.
