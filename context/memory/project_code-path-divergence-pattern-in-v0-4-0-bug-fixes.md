---
id: P-5HMMCC3F
type: project
title: Code-Path Divergence Pattern in V0.4.0 Bug Fixes
created_at: 2026-06-22T13:04:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 98b5170fa97852b0ee762516150fbbdfbb8e75ba5c3ecb433d46c90371ea6259
related: [fixed-bugs-in-task-50-kiro-console-flash-branch, npm-install-g-silent-failure-from-repo-cwd, cmk-tool-invocation-cmk-compress-session-vs-cmk-compress-laz]
---

Six live-test failures (D-185–D-191) stemmed from the same root cause: Claude-Code-only features not ported to their Kiro equivalents. Example: D-191/B1 (uninstall regex) would have deleted users' steering notes. All six were caught by live end-to-end verification before shipping.

**Why:** Indicates asymmetric feature coverage between Code and Kiro implementations. Understanding this pattern informs test strategy and code-review focus for remaining v0.4.0 work.

**How to apply:** For code changes, assume any Code feature likely needs a Kiro equivalent. Prioritize cross-path testing and reviews.
