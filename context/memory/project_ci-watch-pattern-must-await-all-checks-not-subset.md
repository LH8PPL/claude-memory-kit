---
id: P-VQG6TZVA
type: project
shape: Timeless
title: CI Watch Pattern — Must Await ALL Checks, Not Subset
created_at: 2026-07-22T14:06:05Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: df560532b16051775f7b843256cc0bd6f2a880f63607c2947a3cf4059bbc1c68
related: [ci-watch-rule-specify-ci-yml-by-name, workflow-green-commit-green, v0-5-2-release-code-complete-awaiting-final-ci]
---

A proper watch waits for all check-runs (including Sonar) to complete. An earlier loop keyed only on ci.yml and exited prematurely, missing Sonar completion.

**Why:** Sonar is a blocking check; partial watches give false "all green" signals

**How to apply:** When confirming CI settlement, use a pattern that explicitly waits for every check-run, not a filtered subset
