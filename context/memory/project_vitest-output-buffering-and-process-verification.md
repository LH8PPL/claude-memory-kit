---
id: P-96KYDaBH
type: project
shape: Timeless
title: Vitest Output Buffering and Process Verification
created_at: 2026-07-21T20:01:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: aa03a19a13d00136d42f3bf729416f9643c644ae8f17b9c50ccba396495448ef
related: [a-background-job-s-completion-notification-cannot-survive-th, stress-test-configuration-constraints, verify-check-run-agent-liveness-before-status-reports]
---

- Vitest runner buffers stdout until run completion; empty output file early in execution is normal and does not indicate failure
- Reliable proof-of-life: inspect process table for active vitest worker processes (6+ processes over 100 MB each indicate healthy run)
- Do not rely on spawn reports or output file state to confirm execution; process table is ground truth

**Why:** Previous session reported gates "running" when both had actually died; trusting spawn output instead of inspecting process state produced false confidence

**How to apply:** When monitoring long-running vitest stress tests, verify via `ps` or process table inspection for active workers rather than output files or spawn assumptions
