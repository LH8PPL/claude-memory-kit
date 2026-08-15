---
id: P-PGB2YACB
aliases: [P-PGB2YACB]
type: project
shape: State
title: Research Clone Staging at C:\tmp\research-clones\
created_at: 2026-08-15T08:45:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4d17605772771edca3496389b4e9331fc9ab4f7e872fa50cd273c9f9e319679d
---

Competitive analysis and research clones are staged and kept warm at `C:\tmp\research-clones\` to support follow-up verification passes, incremental analysis, and efficient second-pass work without re-cloning.

**Why:** Reduces friction on iterative research; enables fast re-runs for second-pass and post-hoc deep-dives.

**How to apply:** Before starting new research, check for warm clones in this location. Preserve clones between sessions unless explicitly cleaning up.
