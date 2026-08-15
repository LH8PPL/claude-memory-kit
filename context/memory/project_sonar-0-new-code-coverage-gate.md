---
id: P-Q73KUNWJ
type: project
title: Sonar 0%-New-Code Coverage Gate
created_at: 2026-06-13T08:38:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3b64b742f5b416462dce95bc321a5f9536560671
related: [seam-injection-test-coverage-blindspot, sonarcloud-coverage-gate-at-80-on-new-code, claude-memory-kit-v0-4-3-release-workflow]
---

CI enforces zero-tolerance code coverage on new code via Sonar. Any new function or branch not exercised in tests fails the gate and blocks merge.

**Why:** Prevents untested code from reaching production; enforces code quality.

**How to apply:** When gate fails, identify uncovered lines (via Sonar API if needed), add targeted tests covering those branches, verify locally, retry CI.
