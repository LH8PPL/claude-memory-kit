---
id: P-TQMDL5KK
type: project
title: Cron-Liveness Gate by Heartbeat Age (Task 167.A)
created_at: 2026-06-26T09:48:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7bec19a8aa043f823ef422688f78e0eede698ce2d99df83cbad20a731a05d450
related: [openwolf-heartbeat-cron-health-patterns, adr-0002-derive-state-from-artifacts-avoid-markers, cron-liveness-fix-167-a-solves-root-problem-sync-drain-is-se]
---

**Anacron-style heartbeat gate gated on AGE, not existence.**

The fix checks the timestamp of the last cron heartbeat rather than whether the cron process exists. A dead cron can no longer suppress the roll—the age-based gate automatically triggers next session's compaction. Prevents stale-injection and silent failures.

**Why:** Existence checks don't distinguish "never ran" from "dead." Age-based gates are resilient to process death and match production anacron behavior.

**How to apply:** For cron-managed state rotation, gate on heartbeat AGE rather than process existence. Silent failures recover automatically on next session.
