---
id: P-K2C2GJYP
type: project
shape: State
title: Standing OSV Advisory Surveillance (Task 237 Lane)
created_at: 2026-07-21T12:20:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3fba5cf2995761cbc1d8177aa251bc78cc5e4c3435d720e1cac1358f91fb1c17
related: [decide-cron-reliability-backstop-strategy, sonarcloud-as-security-gate-for-redos-detection, post-merge-workflow-sequence]
---

Task 237 establishes a standing watch for upstream advisories that publish *after* a PR lands but before it reaches the repo. Example incident: body-parser and protobufjs advisories published between sessions, caught by standing osv-scan on 2026-07-21. Both bumped, audit clean.

**Why:** Advisory publication is asynchronous and can break main post-merge. Standing surveillance is required because one-time checks miss post-merge arrivals. This incident is hard evidence for Task 237's v0.6.2 scope.

**How to apply:** Maintain standing osv-scan in CI or routine tooling. Treat advisory bumps as standing maintenance, not one-time fixes.
