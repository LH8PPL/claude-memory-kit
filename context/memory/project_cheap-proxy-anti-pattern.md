---
id: P-U37YCE7G
type: project
shape: Absence
title: Cheap-Proxy Anti-Pattern
created_at: 2026-07-20T14:16:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 519ff4cc70cd760f7f315f5770defb2d286be05e89a62b96ff48c02514cc8538
related: [v0-3-5-patch-vs-v0-4-0-versioning-logic, github-metadata-sync-pattern, verify-check-run-agent-liveness-before-status-reports]
---

- Recurring failure: accepting cheap proxies (grep count, single directory, cloned subset) as ground truth for actual metrics
- Proxy is easy to compute but doesn't measure what it claims
- User strength: caught 4 of 5 instances this session

**Why:** Led to undercounting of prior art and false confidence in incomplete scans.

**How to apply:** When measuring, verify the proxy actually measures the target before treating as ground truth. Use direct measurement or widen scope if unsure.
