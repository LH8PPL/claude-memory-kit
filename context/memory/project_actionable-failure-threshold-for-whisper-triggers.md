---
id: P-SaYWRBVS
type: project
shape: Timeless
title: Actionable-Failure Threshold for Whisper Triggers
created_at: 2026-07-22T13:53:14Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 566c1f2c300966a2027c8b7e42f004f48c510241647f71f47625c5fdeb6c2878
related: [failure-driven-whisper-skill-architecture-with-required-amen, full-gate-re-run-on-final-code-after-code-review, direct-to-main-approval-by-campaign-rules]
---

Only alert on failures that represent a pattern or require judgment: repeated failures, or sequence of (failed → fixed → potential regression). Never alert on transient single events (e.g., one Haiku timeout).

**Why:** Prevents alert fatigue; aligns with user principle "never warn on non-actionable issues" and kit's fail-open posture.

**How to apply:** Add actionable-failure check before whisper emission: scan for (repeated-failure OR failed-then-fixed) pattern. Single transient events are noise; skip.
