---
id: P-TUJKaAQ6
type: project
title: Autopilot Memory Consultation Architecture
created_at: 2026-06-12T06:24:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8885cbf204c0f75ef95da3d782daef18c05812ab
related: [doctor-is-reactive-only-memory-write-search-are-automatic, auto-compact-fidelity-loss-mid-task]
---

The kit's memory recall in autonomous (user-unprompted) work operates across three channels:
- **Pushed, always-on**: SessionStart snapshot injects for every turn (autonomous or not)
- **Pulled, by judgment**: authority preamble instruction + model self-judgment trigger memory-search skill (e.g., "that's not in snapshot, searching")
- **Curation is human-gated**: autopilot never resolves queues or forgets autonomously (matches no-auto-git philosophy)
Gap: per-prompt hint fires once per user message (not per autonomous step); snapshot freezes mid-run until next session. Task 74 (PreCompact re-inject) addresses stale breadcrumbs.

**Why:** Autopilot work must leverage memory without explicit asking; design balances autonomous value against deliberate human control over forget/queue decisions.

**How to apply:** When designing autonomous features or longer unmonitored runs, assume SessionStart snapshot is baseline, expect model judgment to trigger pulls, plan for stale-breadcrumb catches post-compaction.
