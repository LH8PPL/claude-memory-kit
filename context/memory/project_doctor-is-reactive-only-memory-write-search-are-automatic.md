---
id: P-HSQMYJJT
type: project
shape: State
title: Doctor is reactive-only; memory-write/search are automatic
created_at: 2026-07-22T13:24:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 02b377da153619f68d39e67cf80a3238cf37088261cff317d87066056f15cc02
related: [principle-u-u5ppsg7y-recorded-but-unimplemented, cmk-view-purpose-and-headline-use-cases, autopilot-memory-consultation-architecture]
---

- memory-write: skill + stop-hook trigger → automatic on "remember this"
- memory-search: skill + per-prompt recall hint → automatic on session start / per-prompt
- doctor: described in CLAUDE.md only → requires explicit user request
- The AI knows doctor exists and what it does, but has no mechanism to run it or act on findings automatically

**Why:** Doctor is critical for health checks, but its reactive-only status leaves failures invisible to the AI and to automatic workflows.

**How to apply:** When designing v0.6.3 auto-surfacing for doctor, use this asymmetry as the baseline. The three proposed design forks (SessionStart auto-run, failure-only hook, extended hint mechanism) are all attempts to break this reactive pattern and wire doctor into automatic flows.
