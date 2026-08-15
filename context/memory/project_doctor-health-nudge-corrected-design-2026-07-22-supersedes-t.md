---
id: P-6YY29BQU
type: project
shape: State
title: Doctor/health nudge — CORRECTED design (2026-07-22, supersedes the SessionStart-
created_at: 2026-07-22T13:47:31Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: c68e70835993c4a3a20bbdd8ed24488301410bd9464661ecf87f5b9afc4a7f57
related: [doctor-as-a-skill-design-2026-07-22-discussion-prior-art-ver, task-250-failure-driven-nudge-implementation, task-248-reframed-the-user-s-design-call-2026-07-22-the-pre]
---

Doctor/health nudge — CORRECTED design (2026-07-22, supersedes the SessionStart-nudge half of P-4L9NLWUL, which the user KILLED). SessionStart status-line nudge is REJECTED: it fires every session (annoying) AND has no self-clean lifecycle — after firing once it can only know the problem is fixed by re-checking every session, which IS the auto-run-doctor already cut (HC-10). THE RIGHT SHAPE: the nudge is FAILURE-DRIVEN, not schedule-driven. The kit already writes its own failure signals (extract.log on auto-extract failure, spawn-error entries when a hook dies, audit.log, poison-guard.log). Anchor the nudge to the EVENT: it fires only when a FRESH failure exists in those logs — not every session, not every prompt, only when something actually broke. Self-cleaning BY CONSTRUCTION: the trigger is the presence of a recent failure signal; fix it -> next run succeeds -> no fresh failure -> no nudge. Nothing to clean up because the signal IS the log state. It does NOT run doctor (reads errors already recorded), so it does not contradict the HC-10 cut. IMPLEMENTATION SKETCH: extend buildMemoryHint in capture-prompt.mjs (the existing per-prompt UserPromptSubmit hint that already whispers 'memory available') to ALSO do a CHEAP check (tail of one log / a failure-marker file, NOT a doctor run — it is on the hot path) for a fresh kit failure since last turn; if present, add a line '⚠ a kit operation failed recently — the troubleshooting skill can diagnose'. Then a NEW troubleshooting SKILL (scaffolded like memory-write/search) triggers on the whisper OR a recognized symptom and teaches cmk doctor + repair/reindex/forget (how/why/when); extensible to other cmk commands. Prior art = NONE (D-374 corpus gap 'self-healing CLI repair UX'); needs outward research + a grill before building.

**Why:** The nudge must key on the ACTUAL failure event (self-cleaning) not a schedule (nags forever or goes stale). A skill alone repeats the under-fire class (D-40/D-153); the failure-driven whisper does the automatic NOTICING (honors D-169), the skill does the how-to. They compose.

**How to apply:** v0.6.3+ grill+research task. Two halves: (a) failure-driven whisper via the existing per-prompt hint reading the kit's own error logs (cheap, self-cleaning); (b) troubleshooting skill teaching doctor+repair. Pairs with reframed Task 248 (install-flow auto-recover) — same surface/act-automatically theme. Outward research FIRST (corpus gap).
