---
id: P-QVG7KT6J
type: project
title: HC-10 — Compaction Liveness Diagnostic (Dev Nice-to-Have)
created_at: 2026-06-25T20:48:16Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 30b21217aae0dc1a9d795379ed6a504b92d8865aaf4739b2ced1d5eeb8f05d6a
related: [hc-10-proactive-dead-cron-detection-question-7, cmk-version-bumping-convention, task-167-drop-hc-10-doctor-check-keep-only-the-free-auto-log]
---

Informational health check for scheduled-compaction liveness (answers "scheduler alive?"). Detects potential dead-scheduler scenarios. Never prescribes fixes. Scoped as dev diagnostic supporting kit development and power-user troubleshooting, not a required part of auto-heal flow.

**Why:** User confirmed it as a nice-to-have; valuable for observability without blocking correctness flow.

**How to apply:** Implement as optional diagnostic. When documenting, frame as "check HC-10 if scheduler looks dead" — never as a required fix step.
