---
id: P-YaFS3Na7
type: project
shape: Timeless
title: Archive Naming and Directory Placement Convention
created_at: 2026-07-27T22:28:07Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3521f6e02ebd28e61075345af062d656aa0f81f151aa724e956a1be0da97e8ee
---

Name archives `<filename>-archive-<context>.md` (e.g., `tasks-archive.md`, `DECISION-LOG-archive-pre-v0.5.md`). Place each archive in the same directory as its source file.

**Why:** Same-directory placement ensures relative links in moved content remain valid. Consistent naming enables discovery.

**How to apply:** Follow the pattern when creating new archives. Confirm all relative links in moved content still resolve after the split.
