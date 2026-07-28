---
id: P-YE5NXD3U
type: project
shape: Timeless
title: Pointer Format for Archived Task Entries
created_at: 2026-07-27T22:28:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0e4bbbaf489eeca12fa5cec715cea1ec99af01534575dc7058ae3cd55216859b
---

When a task entry is archived, replace it in the live file with:
`- [x] NNN. _<verb> <date>, PR #N_ — **<title>** → [archive](tasks-archive.md)`

Verb/date/PR from entry's first annotation span (use `—` where absent). Title = plain-text lead, or first title-shaped bold, or entry lead.

**Why:** Enables readers to quickly locate archived entries. Preserves metadata inline without requiring archive consultation.

**How to apply:** Construct pointers using this exact format when archiving. One pointer line per archived entry adds negligible overhead.
