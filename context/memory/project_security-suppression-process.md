---
id: P-M37PHCRQ
type: project
shape: Timeless
title: Security Suppression Process
created_at: 2026-07-03T13:25:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 9605f03fb065cca96b5f2a18cac7e7a045e843d258cd3a41fad4b82f74caf518
related: [stress-testing-omitted-for-pure-read-cli-changes, decision-log-system-for-known-limitations, stress-test-gating-rule-for-pr-approval]
---

Sonar suppressions must be backed by a formal decision-log entry (D-### number) with per-class threat analysis. Real findings are fixed in code; false positives are suppressed. Pre-approved scopes (e.g., `packages/cli/src/**`) acceptable only if threat class has been reviewed AND structural safeguards (like `validate-spawn-discipline`) exist to catch violations.

**Why:** Prevents silent suppressions from hiding new issues; keeps decisions auditable and traceable.

**How to apply:** On Sonar CI failure, check if threat class was previously reviewed (search D-###). Apply prior decision or write new per-class review. Link D-# in PR or config. Rely on structural tools to catch future violations.
