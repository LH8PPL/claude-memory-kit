---
id: P-aJJN2CYR
aliases: [P-aJJN2CYR]
type: project
shape: Timeless
title: Windows Temp-Dir Teardown Causes EPERM in Test Cleanup
created_at: 2026-08-10T09:34:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b0962b8023f0ed6c1e435554f6f900a27bf0341eca0e6513ed129f0807d64804
related: [windows-rmsync-cleanup-flake-workaround, flake-root-causes-windows-eperm-spawn-concurrency, ci-authority-convention]
---

Local `cli-install.test.js` fails with EPERM on Windows during cleanup due to temporary directory teardown semantics, not a code regression.
Corroboration: ubuntu CI passes without EPERM; Linux environment doesn't exhibit the same issue.

**Why:** Helps distinguish environmental test flakes from actual regressions; prevents false alarm escalations

**How to apply:** If cli-install.test.js EPERM occurs on Windows but ubuntu CI passes, the root cause is temp-dir cleanup semantics, not a code change
