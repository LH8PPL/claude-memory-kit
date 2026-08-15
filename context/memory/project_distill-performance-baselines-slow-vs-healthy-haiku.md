---
id: P-9YCUW5QH
type: project
title: Distill Performance Baselines (Slow vs Healthy Haiku)
created_at: 2026-06-20T13:28:00Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1953c4ca68e60acf5f3f9546c2e31509fadb5fe32c5a6da814cbd8c43f57b6ef
related: [now-md-bloat-creates-silent-failure-trap-in-lazy-roll]
---

- **Healthy Haiku window**: ~20 seconds
- **Slow Haiku window (worst case)**: ~240 seconds
- The 240s worst case consists of: first attempt timing out at 120s (CEILING_FREE_TIMEOUT_MS setting) + 5s backoff (CEILING_FREE_BACKOFF_MS) + second attempt taking ~115s
- Typical distill input size for these measurements: 4.7KB

**Why:** Manual distill run on 2026-06-20 took 240s and succeeded, confirming the v0.3.5 retry fix handles slow-Haiku windows where v0.3.4 would have failed entirely. This is the exact scenario the timeout/backoff tuning targets.

**How to apply:** Expect distill to complete in 20–240s range depending on Haiku responsiveness. If distill exceeds 240s, investigate for performance regression. If it times out without retrying, that indicates a regression in v0.3.5's timeout/backoff mechanism.
