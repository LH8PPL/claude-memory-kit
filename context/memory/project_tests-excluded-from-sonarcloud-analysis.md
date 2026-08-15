---
id: P-NDFFVRaT
type: project
title: Tests Excluded From SonarCloud Analysis
created_at: 2026-07-02T06:59:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 1dd8b6ab0579b3738e308245d7f896f2b712c6576344b824007c9ff8ae1250a6
related: [sonarcloud-as-security-gate-for-redos-detection, sonarcloud-then-in-object-false-positive-schema-fields, ci-authority-convention]
---

- Test files are excluded from SonarCloud scanning (configuration changed in PR #247)
- Rationale: Security/poison-guard tests deliberately contain attack patterns, which Sonar flags as vulnerabilities
- Coverage and correctness of tests are verified structurally by separate validators (e.g., exit-doors validator), not by Sonar

**Why:** Prevents false-positive Quality Gate failures from test fixtures designed to demonstrate defenses

**How to apply:** Exclude `**/*.test.js` from Sonar analysis; use structural validators (exit-doors, unit test assertions) to verify test quality instead
