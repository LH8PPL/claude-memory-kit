---
id: P-LYQMPDX2
aliases: [P-LYQMPDX2]
type: project
shape: Absence
title: Paging Test Fixtures Below Real-World Scale Gap
created_at: 2026-08-09T07:49:48Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 11f3f5ec1499f88d571c780610443116043f3299d829a743d8a7eb283a1826d1
---

Unit test fixtures (max ~12-15 records) fail to trigger paging defects that only manifest at scale. The search oversample pool is `3 × page_size` (default: 3 × 50 = 150), so when corpus < 150, the candidate window never shifts between page requests and ranking defects (drop/duplicate) go undetected. PR #353's test at "a ranked page is a slice of ONE ranking" passes vacuously because `3 × want` exceeds the entire fixture. A drop-and-duplicate bug was reproduced on a 260-record corpus but passed all unit tests.

**Why:** Paging regression tests are systematically too small to catch merge-blocking defects; this is a known gap the repo's live-test rule exists to address.

**How to apply:** Future paging tests should use corpus ≥ 150 with mixed ranking signals; avoid writing new paging regression tests below this threshold; document the minimum in fixtures.
