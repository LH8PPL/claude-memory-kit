---
id: P-HMUEHPRH
type: project
shape: State
title: SonarCloud Misconfiguration — Scans Memory Fact Prose as Code
created_at: 2026-07-12T18:16:37Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 31b512a2c8b5ee13039b365aa95fae48356473d275f3089c7891b84e25d02624
related: [sonarcloud-advisory-role-in-ci-gating, sonarcloud-then-in-object-false-positive-schema-fields, ci-watch-rule-specify-ci-yml-by-name]
---

SonarCloud is configured to scan `context/memory/`, which contains markdown fact prose (not source code). When fact bodies include Windows file paths (e.g., `C:/proj/context`), SonarCloud's Linux runner reports false opendir errors, creating a persistent red check despite CI.yml passing GREEN.

  **Fix:** Add `context/` to `sonar.exclusions` in the SonarCloud configuration.

**Why:** Recurring false-positives in advisory checks dilute signal over time; fixing them maintains integrity.

**How to apply:** Apply the sonar.exclusions exclusion if not yet done. This is a known follow-up task.
