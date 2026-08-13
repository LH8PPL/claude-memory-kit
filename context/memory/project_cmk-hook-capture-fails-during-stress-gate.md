---
id: P-9CY5XHM3
type: project
shape: State
title: CMK Hook Capture Fails During Stress Gate
created_at: 2026-07-13T07:55:24Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3ceac9268b99b9ff3b0b6af1945a760f51a382b9ea51c1bd99965fdf411611f6
related: [windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, sonarcloud-advisory-role-in-ci-gating, better-sqlite3-eperm-cleanup-warning]
---

The `cmk hook promptSubmit: capturePrompt` hook fails with "capture boom" on every stress run (5/5 observed). The failure does not block the stress gate — all runs complete and pass successfully.

**Why:** A future session might encounter this hook failure and wonder if it's critical; knowing it doesn't block the gate prevents unnecessary investigation.

**How to apply:** When you see this hook failure in future stress runs, treat it as a known, non-blocking issue.
