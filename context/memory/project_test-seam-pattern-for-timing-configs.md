---
id: P-SCS957AT
type: project
shape: Timeless
title: Test Seam Pattern for Timing Configs
created_at: 2026-07-13T09:44:33Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 469d0cb6a83050c87abba361bf4819992bad535d0b372d16f689456d43250106
related: [vitest-pool-corruption-transient-load-failures, concurrency-flake-root-cause-real-timeout-under-load, vs-code-vitest-git-bash-environment-issue]
---

Expose production timing constants (debounce intervals, lock timeouts) as test-injectable parameters. This allows tests to run with tight deadlines without polluting assertions. Example: `watcherDebounceMs` allows 80ms test debounce vs 500ms production default. When tests fail under concurrent load, robustify the code to meet the original deadline rather than relaxing assertions.

**Why:** A flaky test masks real bugs. When stress-tested, Task 218's test showed 5/5 failures under full concurrency but passed in isolation. Lowering expectations defeats early detection; fix the root robustness issue instead.

**How to apply:** Use seams (injected constants, environment variables, or DI) to let tests declare their own timing. Validate "no false-green" — ensure tests still fail when the underlying fix is stashed.
