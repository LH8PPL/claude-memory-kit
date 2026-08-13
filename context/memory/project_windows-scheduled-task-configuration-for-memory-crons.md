---
id: P-BE4WKBDa
aliases: [P-BE4WKBDa]
type: project
shape: State
title: Windows Scheduled Task Configuration for Memory Crons
created_at: 2026-08-10T10:43:54Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f77f9c5424182ac9c61a7f8fce5355919c5f9703fa1de39266341eef7aa047e5
---

Registered via cmk register-crons, which uses schtasks on Windows.
  
  **Schedule:**
  - cmk-daily-distill: daily at 23:00 (11 PM)
  - cmk-weekly-curate: weekly on Sunday at 09:00 (9 AM)
  
  **Implementation:** wscript.exe runners in context/.locks/ directory
  
  **Critical flags (starvation prevention):**
  - StartWhenAvailable = true
  - WakeToRun = true
  - AllowStartIfOnBatteries = true
  - DontStopIfGoingOnBatteries = true
  - DontStopOnIdleEnd = true
  
  If any flag is false, D-298 starvation occurs (scheduled runs skip).

**Why:** Core infrastructure for memory system health. Crons manage daily distillation and weekly curation; starving crons block memory consolidation. Verified as of 2026-08-10.

**How to apply:** Verify health via Get-ScheduledTask XML. If starvation recurs, re-run cmk register-crons to restore correct settings.
