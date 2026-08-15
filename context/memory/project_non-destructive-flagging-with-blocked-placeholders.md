---
id: P-TX4R6BVW
type: project
shape: Timeless
title: Non-Destructive Flagging with `[BLOCKED]` Placeholders
created_at: 2026-07-07T20:16:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e5111e616315c87251be0bcd544a2fcd20e47a550a3cb6413a6b2d7cb51141c3
related: [cmk-forget-as-safe-fact-removal-method, false-positive-pii-redaction-recovery-log]
---

Instead of silently removing flagged content, insert `[BLOCKED]` placeholder in prompt snapshot while preserving original in live file. Allows inspection + explicit deletion.

**Why:** Prevents silent data loss; maintains auditability; directly aligns with redaction-log recovery fork in design space

**How to apply:** Use for any flagged entries in memory snapshots to maintain transparency and user control
