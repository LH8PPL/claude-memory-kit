---
id: P-94E7GN3T
type: project
title: Release Cut Gate Validation Pattern
created_at: 2026-06-11T09:17:32Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f62b3363ce33d87a89566fb33a11327bb5c0cdb2
related: [two-bugs-fixed-validation-points-for-session-1-2, d-197-end-to-end-live-re-test-workflow, claude-memory-kit-installation-levels]
---

Before npm pack for a release, run formal validation gate (e.g., `cut-gate9`) that checks memory extraction system health:
- `context/sessions/*.extract.log` shows `observation_count > 0` on substantive turns (not walls of `nothing_durable`)
- `rich_facts_written > 0` in extract logs
- `context/memory/` contains auto-extracted project facts
- MEMORY.md scratchpad has real session content (B1/B2/B9 ticks reflect honest work)

The gate has caught composition bugs that passed 1700+ unit tests and 2+ stress gates.

**Why:** Validates memory extraction system is working before release; acts as a final quality check that automated testing otherwise misses.

**How to apply:** On release day, run gate to verify extraction metrics are healthy. Only proceed to npm pack if gate shows facts_written > 0 and no `nothing_durable` noise.
