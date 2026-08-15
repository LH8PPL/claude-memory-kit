---
id: P-6PGKSVT3
type: project
title: Task 167 testing — agent-run unit + live agent-loop, user does nothing
created_at: 2026-06-25T20:12:21Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f9185a95db7bbff889bb888e8c3893961b0c97dcab3a060ee5f79813a15c628d
related: [cut-gate-test-pattern-for-automatic-cron-drain-healing, auto-heal-path-for-v0-4-1-task-167-d-169-binding, task-167-shipped-live-test-overturned-the-grilled-q4-sync-dr]
---

Task 167 testing (Q6) settled: the user runs NOTHING — not a test command, not 'go'. ALL tests are agent-run (the binding 'all tests run by Claude, not a human' rule). Two layers, both agent-run, both mandatory: (1) UNIT tests in npm test (automatic, free, every change) — isCompactionNeeded returns cronStale:true on {sentinel+stale heartbeat}; sync-drain bypasses cooldown; failed Haiku call doesn't touch cooldown; heartbeat written by cron bin on success. (2) LIVE agent-loop, extending the EXISTING scripts/live-verify.mjs harness (real claude -p sessions, sandbox, cleanup) — a new 'now-roll' scenario: set up the trap state (bloated now.md + dead-cron sentinel), fire ONLY a real SessionStart (NO manual cmk compress/roll/drain call — that would mask the automatic path, the DJ5/D-169 lesson), assert it healed (now.md drained, fresh today-*.md, inject clean), AND a multi-session variant proving it heals in ONE session not many (the bug compounded across sessions). The live one is on-demand (real tokens → not in npm test) but is a REQUIRED part of 'task done' per the binding 'live-test every task' rule. It is the PRIMARY proof — the one that would have caught the original bug. Reuse the existing harness (one harness, more scenarios), don't fragment.

**Why:** The user: 'cant we do an agent loop live test like cut-gate, me doing all this testing will kill me' then 'i dont even need to say go, this is part of the tests'. Correct on both: testing is the agent's job (binding rule), and the live end-to-end check IS part of 'tested' (the binding live-test-every-task rule), not an optional extra. The original bug shipped green because every test ran the compaction command first — so the live test must fire ONLY a session and forbid any manual drain call, or it masks the automatic path again.

**How to apply:** Build the now-roll live scenario INSIDE scripts/live-verify.mjs (reuse its sandbox/session/cleanup). Trap state + SessionStart-only trigger + assert-healed + multi-session-heals-in-one. The agent runs unit tests every change and the live scenario at the gate before declaring 167 done; the user triggers nothing. Forbidden in the live test: any cmk compress/roll/drain call (masks the automatic path).
