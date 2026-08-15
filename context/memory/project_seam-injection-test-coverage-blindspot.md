---
id: P-GXG7L6RH
type: project
title: Seam-Injection Test Coverage Blindspot
created_at: 2026-06-13T08:38:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8e5153b9568e111031df88caf78950fd8b9ad8f3
related: [sonar-0-new-code-coverage-gate, handler-test-coverage-gap-error-exit-branches]
---

Seam-injected tests (mocking/stubbing dependencies) pass integration tests but don't execute all branches of new function bodies. Sonar's 0%-new-coverage gate detects this: new functions appear untested in coverage reports despite passing tests. Workaround: Add no-seam tests directly exercising new functions without mocks, targeting all branch paths.

**Why:** Known pattern (documented in Task-85). Prevents undetected untested code from merging.

**How to apply:** When Sonar flags new-code coverage gaps, add targeted no-seam unit tests. Use Sonar API to identify exact uncovered lines, add tests covering each, verify locally.
