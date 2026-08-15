---
id: P-a3MV5PVK
type: project
shape: State
title: 'The nightly distill schtask CAN be triggered on demand: ''schtasks /Run /TN cmk-d'
created_at: 2026-07-18T14:44:28Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 3fab38d80f01ccaa7e9d555b6b2ec9e8d94c6fe8a241749c5b48a658bbc5192a
related: [cmk-daily-distill-scheduled-task-console-popup-issue, user-runs-full-stack-semantic-always, memory-auto-injection-on-session-start]
---

The nightly distill schtask CAN be triggered on demand: 'schtasks /Run /TN cmk-daily-distill' executes the real registered task immediately (the full schtask→wscript→VBS-shim→node path) — proven live 2026-07-18; it is the truest live-test of the 23:00 pipeline and ran windowless (Task 215 confirmed).

**Why:** Corrects a mis-captured auto-extract fact (P-G4EATW57, now tombstoned) that claimed on-demand triggering was impossible — the claim was disproven minutes later in the same session

**How to apply:** To live-test the nightly pipeline: schtasks /Run /TN cmk-daily-distill, then watch context/sessions/*.distill.log + Last Result; the user watches for window flashes
