---
id: P-6L5CWR9G
type: project
title: CI Pipeline Configuration
created_at: 2026-06-18T08:19:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7871c7f521629c210c8567a170a3336929e927205dcdcf461ec00074b6382636
related: [gate-verification-system-architecture, v0-6-2-published-release-state-and-contents, sonarcloud-coverage-gate-threshold]
---

The project runs 6 automated workflows on each PR merge; all must pass for green status:
- CI (test suite)
- cross-OS install matrix
- canonicalize parity
- CodeQL
- Security
- SonarCloud

**Why:** These define what "CI is green" means in this repo; understanding the full matrix is essential for release QA, troubleshooting, and future expansion

**How to apply:** When evaluating CI status or proposing new validation steps, reference this as the baseline
