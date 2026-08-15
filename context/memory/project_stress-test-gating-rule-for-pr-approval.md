---
id: P-TR9J39LM
type: project
title: Stress Test Gating Rule for PR Approval
created_at: 2026-06-23T13:08:04Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ed929f4550b4a184d1665f9501d4c8a8dddf3f7d29a0112b2ef62c8a78237e1f
related: [stress-flake-self-induced-load-not-regression, stress-gate-release-workflow, full-gate-re-run-on-final-code-after-code-review]
---

PRs in this project must pass a "stress gate (5x)" test requirement:
- The stress gate runs 5 passes automatically
- All 5 must pass (5/5) before proceeding
- If a test failure occurs in an unrelated/known-jitter path (e.g., `spawn-smoke-auto-extract-rich` — live `claude --print` jitter), it's treated as a jitter exception
- When a jitter exception occurs, **two consecutive 5/5 passes** are required to confirm the failure was random
- After two consecutive 5/5 passes, the PR can proceed to code-review-excellence skill pass and then merge

**Why:** Stress testing is critical for regression prevention. The jitter exception rule prevents random failures in unrelated code paths from incorrectly blocking PRs while ensuring real regressions are caught.

**How to apply:** When opening a PR or seeing stress test results in CI, check if failures are in known-jitter paths (e.g., `spawn-smoke-auto-extract-rich`). If all failures are in known-jitter paths, apply the jitter exception rule and re-run the stress gate until two consecutive 5/5 passes are achieved. Only then proceed with the PR.
