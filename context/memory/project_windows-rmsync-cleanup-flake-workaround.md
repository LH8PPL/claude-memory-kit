---
id: P-RVRUBRNV
type: project
shape: Timeless
title: Windows rmSync Cleanup Flake Workaround
created_at: 2026-07-19T07:54:26Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 2de07c4c5dcee8383f013bad0fd953c620f65edc3056f73a470803ea0d12cb23
related: [windows-temp-dir-teardown-causes-eperm-in-test-cleanup, resume-fact-convention-capturing-uncommitted-code-intent, onnxruntime-node-postinstall-cdn-timeout]
---

For Windows `rmSync` EPERM race flakes in test teardown (e.g., `cli-install.test.js`), apply `maxRetries: 10, retryDelay: 100` to cleanup code.

Implementation: 3-line fix distributed across three cleanup sites in the affected test file(s).

**Why:** Windows CI experiences non-deterministic EPERM races during teardown; this pattern is established in the codebase and avoids deep refactoring.

**How to apply:** When test teardown fails with `rmSync` EPERM on Windows, apply this retry pattern to the affected cleanup sites rather than investigating the underlying race.
