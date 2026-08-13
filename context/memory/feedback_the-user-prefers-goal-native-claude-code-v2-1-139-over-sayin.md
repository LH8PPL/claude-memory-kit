---
id: P-3A3PBCVB
type: feedback
title: The user prefers /goal (native Claude Code, v2.1.139+) over saying 'autopilot' f
created_at: 2026-06-20T16:43:31Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 2419853aae3140710ea9e4c585c4ee499498283c2889c9ef036cb22588966765
related: [autopilot-grant-v0-3-x-queue-2026-06-12, task-95-dream-re-curation-path-settled-2026-07-17-ship-v0-5]
---

The user prefers /goal (native Claude Code, v2.1.139+) over saying 'autopilot' for hands-free multi-turn work. /goal <condition> keeps Claude working across turns until a small fast model confirms the condition holds; it auto-starts each next turn (removes the per-turn 'continue' friction plain autopilot still has). It's a user-typed slash command (Claude cannot invoke it). The repo's CLAUDE.md 'autopilot' contract (two-pass review, stop-on-fork, housekeeping) remains the QUALITY discipline applied INSIDE each /goal turn — encode the stop-rules into the goal condition.

**Why:** The user asked about /goal as a replacement for 'autopilot'; the primary docs (code.claude.com/docs/en/goal) confirm it's the better mechanism — truly hands-free vs autopilot's per-turn nudge. They're complementary: /goal = the loop, the autopilot contract = the discipline inside the loop.

**How to apply:** When the user wants hands-free task execution, suggest they type a /goal whose condition encodes the autopilot stop-rules (tests green + two-pass review + merged + 'stop on any fork or system-touching step' + a turn cap). Run the normal autopilot discipline inside each goal turn. Do not try to invoke /goal yourself — it's user-side.
