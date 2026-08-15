---
id: P-JHZ6ZT27
type: project
title: SonarCloud `then`-in-object False Positive (Schema Fields)
created_at: 2026-06-21T10:30:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e0f3b1f23e69851d7898d02fa828b77914b56668d2e73e3f84391c07c2c0a96f
related: [sonarcloud-as-security-gate-for-redos-detection, sonarcloud-hotspot-review-mark-safe-with-comment, extend-file-rewrite-rule-to-all-tools]
---

SonarCloud flags `then` as a field name under its `then`-in-object rule. The rule is legitimate (accidental thenables break Promise chains), but in Kiro's schema, `then` is just a field name, not a thenable. Fix: use bracket notation (e.g., `schema[then]` instead of `schema.then`) — result is byte-identical output.

**Why:** This rule fires reliably on any field named `then`. Without knowing it's a false positive in this context, developers may over-fix or be confused by the flag during CI.

**How to apply:** When SonarCloud flags `then`-in-object in future PR checks, if it's a schema field: apply bracket-notation refactor and verify byte-identical output. Sonar will re-pass.
