---
id: P-G22QZQL2
type: feedback
shape: State
title: A health check behind a command does NOT surface a silent failure - it relocates
created_at: 2026-07-20T09:33:38Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: fd4d10171a98945d402346b1d6892b0d4d16e84ecaa2f4096f1f153d12606519
related: [when-an-automatic-path-fails-build-a-fallback-mechanic-that, task-done-goal-explicitness-rule, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre]
---

A health check behind a command does NOT surface a silent failure - it relocates it. A user never runs cmk doctor unprompted, so any signal that only appears there reaches only someone who ALREADY suspects a problem. The kit's real unprompted channel is the SessionStart systemMessage status line (inject-context.mjs:1097, buildStatusLine): systemMessage is the USER-DISPLAY channel while additionalContext is model-facing (the D-116 primary-source finding), and the kit already emits exactly one such line per session with zero commands.

**Why:** The user's catch on Task 242: 'what does a doctor check help? a user will never run a doctor check.' I had specified the fix for a SILENT failure as a doctor check - violating D-169 (any capability claimed automatic needs a criterion asserting the automatic path with NO manual command) inside the very task written to enforce it.

**How to apply:** When surfacing any automatic-path failure: put the signal in the SessionStart systemMessage status line first (unprompted, already shipped, silent-when-healthy), and treat a cmk doctor HC-* as the SECONDARY diagnostic for someone already investigating - never the only surface. Done-criterion must be 'the warning appears with no command run', tested by driving the real bin.
