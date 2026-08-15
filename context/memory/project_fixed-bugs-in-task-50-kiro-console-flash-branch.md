---
id: P-Pa6U2LUB
type: project
title: Fixed bugs in task-50-kiro-console-flash branch
created_at: 2026-06-22T12:53:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d5b37ad7e652d9c9e1ddae47c338d7569256328469352232a65ed856f40a5df6
related: [code-path-divergence-pattern-in-v0-4-0-bug-fixes, stress-test-gating-rule-for-pr-approval, uninstall-end-to-end-verification-results]
---

- D-190: Console popup bug (fixed)
- D-191: Uninstall husks bug — kit-only files not fully removed (fixed + live-verified)
- D-191/B1: Regex data-loss bug — could have deleted users' steering notes; caught in skill-review before ship (fixed + live-verified)
- All 3 fixes awaiting stress test completion (5/5) before PR/CI/merge

**Why:** Uninstall correctness and data-loss prevention are critical; these fixes are verified and ready

**How to apply:** Reference D-191/B1 (the data-loss regex) when reviewing uninstall PRs or testing; know these three are known-good in this branch
