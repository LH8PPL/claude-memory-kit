---
id: P-RX6DWHZD
type: project
title: System-touching features are skipped in automated verification runs
created_at: 2026-06-18T15:42:09Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1bf4bc19d02a9b93177fc95ae45f5f7907bc8693e2567f7cf2b88a6b7bb2a784
related: [kit-design-principle-zero-git-writing-code, memory-review-discipline-before-commit, test-artifacts-can-contaminate-fresh-install-testing]
---

Features that mutate host system state (F-6 register-crons, F-13 import real Auto Memory, F-14 long-running server, F-15 full history scan, F-19 destructive uninstall) are deliberately not auto-run during verification sweeps. They are listed explicitly and require per-item user sign-off before execution.

**Why:** Protects the user's real system and data from unintended side effects during automated testing.

**How to apply:** When running verification sweeps, clearly mark system-touching operations as "deliberately skipped," list them separately, and ask the user which (if any) they want to run next. Do not presume to execute destructive or system-mutating operations.
