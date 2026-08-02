---
id: P-UXCMUV5a
type: project
shape: Plan
title: Task 258 Kept Separate from Task 250 (Approved)
created_at: 2026-08-01T12:57:50Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5f9e811d8ae8aa4fe9c7b52c278577d179ec69ca378d637706d501c0ea3b20e6
---

Task 258 (stale-refs scan) will NOT be folded into Task 250 (whisper instrumentation). Instead, Task 258 will ship later as a standalone, low-severity advisory task once its noise-floor measurement is completed on the real corpus.

**Why:** Task 250 targets strictly actionable failures (wave 1 scope). Task 258 is advisory in nature ("some facts cite files that moved") — a different severity class. Coupling them would gate Task 250's release on Task 258's measurement work, causing unnecessary scope creep.

**How to apply:** Task 250 ships with the approved wave-1 instrumentation. Task 258 enters later via the same registry-extension door (a new advisory class = one registry entry + one append site) after noise-floor is measured.
