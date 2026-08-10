---
id: P-9V3K7KEA
type: feedback
title: were in the memory business — correctness over startup speed
created_at: 2026-06-25T20:06:26Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: b3d33ae33560c447fbfb8c68e4166543d7c3e9304c4348f26cbcc2e749b080fe
related: [task-167-cooldown-success-only-touch-sync-drain-bypasses-it, task-167-shipped-live-test-overturned-the-grilled-q4-sync-dr, task-167-testing-agent-run-unit-live-agent-loop-user-does-no]
---

Design principle (the user, 2026-06-25): "we're in the memory business" — correctness of memory ALWAYS beats startup speed. A few seconds slower start is fine; stale or wrong memory/info is NOT. Applied to Task 167 (Q4): when now.md has un-rolled prior-session content AND the cron looks dead, drain it SYNCHRONOUSLY before injecting so THIS session reads clean (not the old detached heal-next-session, which could serve one stale session). Safety valve for the pathological case (e.g. 400KB): drain synchronously up to a TIME BUDGET, finish the remainder detached — never serve stale, but never hang the user out of their session (also covers offline/Haiku-down: try sync up to N seconds, else best-available + finish detached). Fully automatic + invisible either way (no user command/prompt; D-169 automatic-path criterion holds).

**Why:** The user's call when choosing how Task 167's lazy roll heals a bloated now.md: "i rather it take more time than stale or wrong memory/info, we are in the memory business." This is a durable product principle, not a one-off — for a memory tool, serving stale/wrong recall is the cardinal failure; a slower startup is an acceptable price. It pushes the design past a size-threshold compromise toward "drain synchronously whenever stale content exists," with a time budget only to prevent a hang (which would itself cause stale-serving).

**How to apply:** Whenever a correctness-vs-speed tradeoff arises in the kit, choose correctness: never inject/serve stale or unverified memory to save time. For Task 167: sync-drain on stale+dead-cron before inject; time-budget the sync portion only to avoid hanging the session (offline/huge-file), finishing the remainder detached — this session still gets the freshest possible state. Generalizes to any future inject/recall/compaction path: a slower-but-correct path beats a fast-but-stale one.
