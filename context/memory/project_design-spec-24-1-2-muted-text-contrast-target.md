---
id: P-XAVJDNDM
aliases: [P-XAVJDNDM]
type: project
shape: State
title: 'Design Spec §24.1.2: Muted-Text Contrast Target'
created_at: 2026-08-03T18:26:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dc533d9ad74ffca31f169ace99548962c642746a406b52a1f45d829d3c89a281
---

Muted-text token: `#676158`. Contrast target: AA 4.5:1 minimum. Non-exemption rule: 11px/600 weight does NOT qualify for large-text exemption (so 4.5:1 is the floor, not 3:1). Implemented with automated test that computes contrast ratios from served CSS.

**Why:** Prior round trusted reviewer suggestion without measurement; this ensures contrast failures are caught before deployment.

**How to apply:** Maintain contrast test in CI. Treat §24.1.2 as binding design contract. Update test if token value is modified.
