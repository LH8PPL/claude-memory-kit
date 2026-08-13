---
id: P-U5LLL2CL
type: project
shape: State
title: Auto-extract degrades to ZERO captures under heavy concurrent load in the same s
created_at: 2026-07-20T09:19:35Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 707f42c81a4313cdacd5171d4b5729ff3b421e9856db23804470af92e6096f5a
related: [when-an-automatic-path-fails-build-a-fallback-mechanic-that, memory-tiers-carry-mission-context-only-the-user-s-project-d, doctor-health-nudge-corrected-design-2026-07-22-supersedes-t]
---

Auto-extract degrades to ZERO captures under heavy concurrent load in the same session. Evidence 2026-07-20: 6 of 6 extractions ended haiku_timeout, each burning the full 90s budget (duration_ms 90030), while the session ran subagents, full test suites and 24-way concurrent spawn probes. Normal days show the opposite ratio (74 successes/6 timeouts on 07-01, 52/3 on 07-15, 111 successes across two sampled days). So the loop is NOT broken - it is starved, and it fails SILENTLY: nothing in the chat says 'your last 6 turns were never captured'.

**Why:** This is a silent-degradation class, the worst shape for a memory kit: the user believes capture is automatic, the hook fires every turn, and the only evidence of total failure is a phase:extract error_category:haiku_timeout line in context/sessions/DATE.extract.log that nobody reads. On a heavy session - exactly the sessions richest in durable findings - the automatic path can contribute nothing while appearing healthy.

**How to apply:** Two directions, both cheap: (1) SURFACE it - HC-* health check or a doctor line that reads today's extract.log and FAILS when the success rate is 0 or the timeout rate crosses a threshold, so 'my memory did not capture today' is visible without reading NDJSON; (2) SURVIVE it - on haiku_timeout, fall back to a deterministic no-LLM capture (the turn's user-stated durable lines) instead of dropping the turn entirely, so a starved loop degrades to partial capture rather than zero. Do NOT just raise the 90s budget - that trades silence for slowness.
