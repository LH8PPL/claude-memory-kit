---
id: P-AJMLYMUW
type: project
shape: Timeless
title: VS Code + Vitest + Git Bash Environment Issue
created_at: 2026-07-22T20:56:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: bf78603f15bf443ab203c567f6d51e809e7a013ad90a44aea75d709d33956691
related: [vitest-pool-corruption-transient-load-failures, vitest-workers-spawned-from-the-claude-code-bash-tool-inside, line-ending-normalization-risk-in-python-rewrites]
---

VS Code's electron environment variables can poison vitest workers when tests are launched from Git Bash, causing spurious test failures. The same tests run clean when executed from PowerShell.

- Symptom: tests fail from Git Bash, pass from PowerShell
- Root cause: VS Code's electron env vars leak into test process
- Workaround: run tests from PowerShell instead

**Why:** Environment-specific issue that causes hard-to-diagnose test flakes; explicitly surfaced as worth documenting to prevent future re-diagnosis sessions

**How to apply:** When tests fail unexpectedly (especially from Git Bash in VS Code), try running from PowerShell to confirm/rule out this issue
