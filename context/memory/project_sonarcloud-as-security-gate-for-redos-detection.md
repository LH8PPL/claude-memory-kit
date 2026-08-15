---
id: P-Y7Q532UC
type: project
title: SonarCloud as Security Gate for ReDoS Detection
created_at: 2026-06-21T09:13:43Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 246673b78c3f5db52442ef9b9d9f6c0714456ab98a8f6f9f31ae78a2620993b7
related: [sonarcloud-then-in-object-false-positive-schema-fields, stress-test-phase-in-pre-merge-workflow, tests-excluded-from-sonarcloud-analysis]
---

SonarCloud is the final CI gate in the PR workflow (after coverage thresholds and full test suite). It has previously detected ReDoS vulnerabilities not caught by functional tests or coverage checks.

**Why:** SonarCloud provides security-focused static analysis. Understanding its role and historical effectiveness (catching ReDoS) explains why it's the final merge gate.

**How to apply:** Treat SonarCloud as a security-focused gate. If it flags an issue, fix it before merge — it has a proven track record of catching real vulnerabilities.
