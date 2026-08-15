---
id: P-U7T2QU6R
aliases: [P-U7T2QU6R]
type: project
shape: Timeless
title: CI Authority Convention
created_at: 2026-08-13T13:16:25Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dba23b96c1fa3bfdba03653b9d7980c3c12cd583093cbaba1c377b20b0bda36f
related: [npm-test-fragility-under-load, known-environmental-artifact-laptop-sleep-during-tests, windows-temp-dir-teardown-causes-eperm-in-test-cleanup]
---

Ubuntu CI is the authoritative gate for test passes. Local `npm test` results are not reliable under load and should not block releases.

**Why:** Prevents false passes/fails from blocking releases; establishes single source of truth for test status

**How to apply:** When evaluating test results, trust ubuntu CI gate; flag local test failures as environmental issues, not release blockers
