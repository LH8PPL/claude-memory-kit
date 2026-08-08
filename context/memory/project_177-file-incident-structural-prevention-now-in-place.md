---
id: P-9NBLW5ZC
aliases: [P-9NBLW5ZC]
type: project
shape: Absence
title: 177-File Incident — Structural Prevention Now in Place
created_at: 2026-08-08T14:24:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f555657e74d018090425e96c659321758020defc3822f2d1114ae17ca4d09048
related: [test-suite-isolation-guard-required-known-risk, traversal-dilution-binding-design-constraint, task-246-phase-2-redirect-capture-hook-bins-to-root-resolver]
---

Structural fix: scaffold smoke test inverts to sandbox-by-default. This prevents any future verb from live-firing against real memory corpus during testing. Eliminates the root cause of the 177-file incident by making unsafe operations opt-in rather than default.

**Why:** Prior incident destroyed large corpus subset; structural guard needed to make recurrence impossible, not just less likely.

**How to apply:** Smoke-test framework now sandboxes by default; any live-fire operation against real corpus must explicitly opt in. This is a permanent shift in test safety posture.
