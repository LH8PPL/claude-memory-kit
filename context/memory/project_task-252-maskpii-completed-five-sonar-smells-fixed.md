---
id: P-RVXW3NEW
type: project
shape: Event
title: Task 252 (maskPii) Completed — Five Sonar Smells Fixed
created_at: 2026-07-28T08:22:22Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ca34f1c59bc7340e72249bac352edaab4261038982c8ac201488ad12f4826d37
related: [run-cmk-register-crons-after-pr-351-ships, stress-testing-omitted-for-pure-read-cli-changes, stress-gate-required-before-pr-for-spawn-hook-boundary-chang]
---

- Task: "Implement Task 252 maskPii"
- Scope: Five Sonar code smells in PII masking logic
- Strategy: Hard behavior lock via `.source`-equivalence verification (no regex changes)
- Status: Commit pushed to PR #330; check suite re-running

**Why:** Completes a privacy-critical Sonar cleanup; the five-smell pattern and behavior-lock methodology may be reusable for future PII-related fixes

**How to apply:** Reference when debugging similar PII masking smells; confirm whether five is typical for this domain or a one-off finding
