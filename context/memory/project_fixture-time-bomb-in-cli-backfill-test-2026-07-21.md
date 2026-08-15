---
id: P-UB9UP3TD
type: project
shape: Event
title: Fixture Time Bomb in cli-backfill Test (2026-07-21)
created_at: 2026-07-21T12:20:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6be2ce104ce931d1e51f6a1d7bcc5bea219b5df3376441fc1805af7bde4dd028
related: [github-actions-username-privacy-mask-collision, file-pointer-format-and-interpretation, regression-test-pinning-on-bug-fixes]
---

A test fixture contained hardcoded `2026-07-07` date within a 14-day lookback window. When the current date crossed the window edge (2026-07-21, 12:10 UTC), the test failed deterministically. Fixed with relative dates and incident documented at the helper.

**Why:** Time-dependent test fixtures decay predictably and exemplify Task 236's thesis on rot. Hardcoded windows are a hazard class that requires relative dates as remedy.

**How to apply:** When tests fail coincidentally (not correlated to recent commit changes), check for hardcoded dates or time-sensitive thresholds. Favor relative dates in fixtures to prevent future window-crossing failures.
