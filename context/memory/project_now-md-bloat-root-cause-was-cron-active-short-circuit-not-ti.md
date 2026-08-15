---
id: P-DZDQSDQG
type: project
title: now.md bloat root cause was cron-active short-circuit not timeout
created_at: 2026-06-25T13:50:24Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 9bde5854f79dd51372c77dd10cc235fd49dc980b686dd205c9cfb955a445a8d2
related: [now-md-bloat-creates-silent-failure-trap-in-lazy-roll, task-167-testing-agent-run-unit-live-agent-loop-user-does-no, task-167-drop-hc-10-doctor-check-keep-only-the-free-auto-log]
---

The now.md bloat (410 KB) that froze the injected snapshot was caused by the lazy roll being GATED OUT, not failing: detectStaleness short-circuits to cron-active on the mere existence of the cron-registered sentinel (above the bloat check), but the host cron never actually ran (registered "Ready", LastRunTime blank). The fallback deferred to a dead primary. Confirmed from lazy-compress.log — skipped every SessionStart, never a timeout.

**Why:** I first guessed "the Haiku roll timed out on 410 KB" and wrote that into the task. Reading lazy-compress.log corrected me: the roll was SKIPPED every time (cron-active, then cooldown), never attempted. A registered-but-dead cron disabled the only working compression path. This is the "did you check the primary source?" lesson applied to a root-cause claim — the log is the primary source; my recall was wrong.

**How to apply:** When diagnosing why an automated path didn't run, read its OWN log before theorizing about failure modes. A "skipped" log entry (never ran) is a different bug class from a "timed out" entry (ran, failed). The fix is Task 167.A: cron-active may only short-circuit if the cron actually ran recently, not just because the sentinel exists. A sentinel that disables a fallback must verify the primary is alive.
