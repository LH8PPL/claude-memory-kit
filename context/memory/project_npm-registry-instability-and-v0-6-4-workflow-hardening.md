---
id: P-V64HWUUZ
type: project
shape: State
title: npm Registry Instability and v0.6.4 Workflow Hardening
created_at: 2026-07-29T08:09:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e31145ab476c9b1d3d49ae1ca88abb6770052772682d426957cb831d91a864bf
related: [prebuild-install-deprecation-causing-npm-ci-failures, v0-4-5-roadmap-task-196-cursor-adapter-task-198-temporal-swe, v0-3-0-released-with-green-quality-gate]
---

- Observed: Five npm registry blips this week affecting CI
- Proposed mitigation: "retry-once-on-npm ci" workflow hardening (candidate idea from prior session, now promoted to "worth filing")
- Target: v0.6.4 release lane

**Why:** Registry instability is causing build failures; retry-once-on-npm ci is a proven, concrete mitigation worth prioritizing in the next release cycle

**How to apply:** When planning v0.6.4, file a task for the retry-once-on-npm ci workflow improvement; prioritize as a reliability hardening measure
