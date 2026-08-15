---
id: P-YRNXAYa9
type: project
title: Resume point v0.4.3 pre-merge (code-complete)
created_at: 2026-06-30T12:02:18Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 9587797e1aa63f945c5156b96c5bbaa486226c9a24b2696d3077888a5f997824
related: [resume-point-task-151-13-last-151-sub-task, resume-point-task-151-7-trust-update-rule, release-workflow-with-cut-gate-testing]
---

RESUME POINT (v0.4.3, branch task-151-recurrence-promotion): v0.4.3 is CODE-COMPLETE on the branch — Task 151 (ALL 13 sub-tasks + the 151.5 re-eval) + Task 70.4 (invisible/zero-width/bidi Unicode Poison_Guard block) + Task 74 (post-compaction re-inject verify-and-lock-in). Last commit 23a573d. Full suite 2478/2478. Decisions D-228 through D-244 in DECISION-LOG. NEXT = PRE-MERGE steps (the maintainer's outward gate): (1) run the WHOLE-branch skill-review — `code-review-excellence` over the full diff `git diff main...task-151-recurrence-promotion` (151 + 70.4 + 74 together, one holistic pass) — the per-sub-task reviews happened inline but a final whole-diff pass is owed; (2) `npm run stress` 5/5 (the gate before merge; note the harness flaked twice this session with all-suites-fail-to-load = transient vitest pool corruption, fresh re-run clears it — npm test is authoritative, 2478/2478); (3) then merge `task-151-recurrence-promotion` to main (squash) + cut v0.4.3 via `npm run release -- minor` (the maintainer's outward step — DON'T do npm publish / tag push myself). CHANGELOG [Unreleased] already has the v0.4.3 entries (persona-recurrence, condense-not-evict, trust_score, topic-routing, the Security/Unicode block). REMAINING MANUAL CAVEATS to flag at cut: Task 74's LIVE compaction confirmation (trigger a real auto-compact, see the snapshot reappear — verified vs doc+code+tests, not live); the 151 MCP-tool/in-chat surfaces (mention relay, mk_lessons_promote routing) are flagged for the manual live-test session. After v0.4.3 ships: v0.4.4 = Task 66 (temporal engine) + Task 150 rider (AI-judged memory-commit). PAUSED at maintainer request after Task 74 (v0.4.3 code-complete).
