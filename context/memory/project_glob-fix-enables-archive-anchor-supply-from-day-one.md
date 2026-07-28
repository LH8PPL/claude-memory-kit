---
id: P-SMaT2YJ5
type: project
shape: Timeless
title: Glob Fix Enables Archive Anchor Supply from Day One
created_at: 2026-07-27T21:53:43Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d8e3e8e4b753ba206fb50f2cf9fce3a29fc8d2bd5368a7babf2a71f77564c331
---

Task 247's glob fix enables Task 249's archive split by ensuring archived decisions can correctly supply their anchors from the moment of split.

**Why:** Without the fix, anchor distribution across archive segments would be ambiguous or incorrect, blocking clean boundary selection.

**How to apply:** Task 249 proceeds with archive split knowing the glob fix has already solved the prerequisite anchor-supply pattern.
