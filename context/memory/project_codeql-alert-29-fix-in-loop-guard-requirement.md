---
id: P-BEJQYEaZ
type: project
title: 'CodeQL Alert #29 Fix—In-Loop Guard Requirement'
created_at: 2026-06-28T17:35:35Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 92ed9a9ff861ea9e909476fb2555be35e3e0cdb25ce1942a3db5e977eb3a618c
related: [v0-5-0-release-workflow-stress-commit-push-pr-merge-repack-g, codeql-prototype-pollution-guard-recognition]
---

CodeQL alert #29 (prototype-pollution) requires the guard to be placed **inside the loop**, not before it.

- Initial attempt: guard before loop (incorrect—CodeQL's static analyzer doesn't recognize it)
- Corrected form: guard inside loop (verified from CodeQL query-help documentation)
- Implementation: PR #243, tested at 25/25 (100% coverage)

This fix was discovered by reviewing CodeQL's own query-help docs for the alert.

**Why:** Loop placement is non-obvious; shipping v0.4.2 claimed "3 alerts resolved" before CodeQL's docs were checked, leaving the actual fix incomplete. Future CodeQL alert work must consult query-help first.

**How to apply:** When fixing CodeQL alerts, read the alert's query-help documentation (CodeQL UI or official docs) to confirm the expected guard/fix pattern before shipping a claimed fix.
