---
id: P-XVEYV7a4
type: project
title: D6 Fail-Safe Behavior on Compress Timeout
created_at: 2026-06-18T14:18:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 9fb95902dd1eb3552183b7d775d873835f25f89f0e79f4d12f729a851074f074
related: [d6-now-today-roll-fail-safe-behavior-con-dv52lvvn, auto-extract-reliability-pattern, index-md-is-a-committed-human-readable-artifact]
---

When SessionStart compression times out: now.md is preserved (not corrupted), the failure logs cleanly (`success: false, haiku_timeout`), and retry happens on next SessionStart. Nothing is lost or broken.

**Why:** D6 gate failure is acceptable because the kit does not corrupt or lose state; it degrades gracefully.

**How to apply:** Treat D6 timeout as a yellow flag, not a blocker. The fail-safe means the kit recovers automatically.
