---
id: P-GVWPRDH4
type: project
shape: Absence
title: False-Green Health Strip Pattern
created_at: 2026-08-02T12:56:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 633c44db3c71daa414c0dfe3943fc2afd73f99902b9eb9879659790b2cc421de
---

Quick check claims "capture is fine" while `cmk doctor` shows failures below it (composition gap between two correct components). Happens when cheap checks make positive claims instead of honest "no failures detected (quick check)" phrasing.

**Why:** Masks real issues; poor health/check UX when components are correct in isolation but fail in composition.

**How to apply:** Health checks should never make positive claims in cheap/quick modes; fold detailed results into comprehensive checks; seed a broken hooks block in live-verify tests to catch this pattern.
