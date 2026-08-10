---
id: P-aRHH7Va5
type: project
title: 'ADR-0002: Derive State from Artifacts, Avoid Markers'
created_at: 2026-06-25T19:54:38Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6a0db8c6f17255dd55b4fe3b5bad252eb23cecc87a14610e993a933d45071c49
related: [derive-vs-stamp-design-rule, cron-liveness-gate-by-heartbeat-age-task-167-a]
---

- Compaction-State should derive `now`/`daily`/`weekly` levels from artifact mtimes (`now.md`, `recent.md`, `today-*.md`), not persistent marker/sentinel files.
- Single exception: ONE anacron-style `cron-heartbeat` stamp (gated on age, not existence) for detecting cron-liveness.
- Rationale: markers are brittle, redundant, and create two-writer hazards.

**Why:** Artifact mtimes are durable and already integrated into the system; markers add failure modes and sync risks.

**How to apply:** When designing state-tracking modules, prefer artifact queries over persistent sentinels; use heartbeats only for signals not derivable from artifacts.
