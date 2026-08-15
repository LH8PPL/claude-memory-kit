---
id: P-MLBNJHWN
type: project
shape: Timeless
title: Verify Check-Run Agent Liveness Before Status Reports
created_at: 2026-07-20T20:58:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6e0b9ad1a39dcf96890c8f424f3e65a0abc39ca2c8c9e66e9a68c993df3fa753
related: [workflow-green-release-commit-checks-green, workflow-green-commit-green, ci-watch-rule-specify-ci-yml-by-name]
---

When assessing CI status, "running" does not guarantee a check is responsive. During v0.6.1, a review check was reported "running" but was actually dead for 54 minutes. Do not assume a "running" state is current; verify actual responsiveness or recent activity timestamps before declaring check status.

**Why:** False "running" reports can mask real failures or delay diagnosis during release verification.

**How to apply:** Before reporting CI checks as "green," spot-check agent health via timestamps or recent activity. If a check claims "running" but hasn't updated in a suspicious window, investigate directly.
