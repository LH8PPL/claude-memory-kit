---
id: P-3AE6UM2W
type: project
title: CodeQL Alerts Close on Main Commit, Not NPM Release
created_at: 2026-06-28T17:11:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7ff2945139d47c0501e96a228586d6bef37a186981f700eb08401d601c5f2a7b
related: [release-workflow-with-cut-gate-testing, minor-release-triggers-backlog-sweep, cmk-version-bumping-convention]
---

- CodeQL scans `main` on every push; an alert closes when the fixed code lands on `main`, not when you publish to npm
- The npm version number and CodeQL alert status are independent concerns
- You can merge a fix to `main` (alert closes on next CodeQL re-scan) without cutting a new npm release if the fix has no user-facing behavioral change

**Why:** Clarifies the relationship between CodeQL workflow and release management; the previous entry expected alerts to auto-close but didn't explain the mechanism or its independence from npm versioning

**How to apply:** When a CodeQL alert surfaces, merge the fix to `main`—the alert will close on the next scan regardless of npm version. Only cut a new npm release if there's a user-facing change or a separate release reason.
