---
id: P-ZNJNM7ZC
type: project
shape: State
title: 'SonarCloud D-341: Known Server-Side Crash'
created_at: 2026-07-15T20:39:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e4ebc663fdf000d33a8ed7946499860a8dd08bfdfd9915f15c7a0fd0b0867849
related: [d-386-documents-known-sonarcloud-server-side-failure, onnxruntime-node-postinstall-cdn-timeout, autopilot-merge-rules-for-install-surface-changes]
---

- SonarCloud fails on every push with a server-side crash (vendor bug)
- Marked advisory-only: does not block CI/CD, merge, or deployments
- Tracked as D-341; vendor bug already filed; unrelated to project code changes
- Consistent, repeatable behavior

**Why:** Future sessions should recognize this as expected and harmless, not a regression or blocker

**How to apply:** If SonarCloud fails in CI with server-crash errors, check D-341 status; if it matches, safe to ignore and proceed with other gates
