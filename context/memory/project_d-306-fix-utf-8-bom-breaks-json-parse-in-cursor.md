---
id: P-HCSNKa3W
type: project
shape: Event
title: 'D-306 Fix: UTF-8 BOM Breaks JSON.parse in Cursor'
created_at: 2026-07-09T18:04:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c3852ddeb6793e591ed2696e61532d1463a50d138728898f5158f8c180887b5e
related: [cursor-gate-test-path-procedure-v0-5-0-release, v0-6-3-released, cursor-gate-v0-5-0-test-procedure]
---

UTF-8 byte-order marks (BOM) were breaking JSON.parse during Cursor bi-turn capture. Fixed in v0.5.0 with TDD and end-to-end verification (full suite 2833/2833 passing). Documented in CHANGELOG, D-306 doc, and Task 207.

**Why:** Real bug in Cursor Windows capture of agent interactions; now resolved and thoroughly tested before release.

**How to apply:** When testing JSON parsing in Cursor hooks or similar systems, verify BOM handling is correct. Reference D-306 if similar issues arise.
