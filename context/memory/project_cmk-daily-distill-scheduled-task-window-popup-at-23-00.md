---
id: P-R34LNWQ7
type: project
shape: Timeless
title: cmk-daily-distill Scheduled Task Window Popup at 23:00
created_at: 2026-07-10T20:14:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: acdbdd224a5501224b745c98b393ebc910830d74f426cd04fcaf9ae6033736ad
related: [cmk-daily-distill-scheduled-task-console-popup-issue, windows-dll-locking-during-cmk-reinstall, register-crons-for-staleness-starvation-prevention]
---

The claude-memory-kit installation includes a Windows scheduled task `cmk-daily-distill` that:
- Runs daily at 23:00 (11 PM) Windows time
- Launches node.exe as a console application (visible black window for 1-2 minutes)
- Completes successfully with no errors
- Harmless but a UX wart when it pops during evening use

Fix is known: register task to run hidden (session-0) or use a windowless launcher; tracked as Task 215.

**Why:** Next session will need to recognize this 23:00 popup as expected behavior, not a bug

**How to apply:** If black console window appears at 23:00, it's cmk-daily-distill (harmless); to eliminate, implement Task 215 fix
