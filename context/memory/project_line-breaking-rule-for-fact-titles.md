---
id: P-WKGG7YK5
aliases: [P-WKGG7YK5]
type: project
shape: Timeless
title: Line-Breaking Rule for Fact Titles
created_at: 2026-08-03T18:26:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7059f2c14e36af4ebcf86ea51d860c74a51ca41a8bed2906164596284ee53487
---

Line breaks outrank other boundaries when splitting content. A short first line (e.g., `**What changed:**` at 13 chars) signals an intentional heading, not overflow to be split around.

**Why:** Fact B1 regression was caused by `**What changed:**` fitting its own line, which forced the next split inside the bullet. Treating short lines as heading anchors prevents this.

**How to apply:** In title-and-bullet splitting logic, check for line breaks first. Short lines should be treated as intentional heading markers, not obstacles.
