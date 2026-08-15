---
id: P-GYVP2H7V
type: project
shape: State
title: v0.5.3 Release Complete — Ready for Publication
created_at: 2026-07-14T06:34:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 342173b358628a2f51f081b0ab91cb65931260397b390c3a6795eee551075665
related: [v0-5-3-roadmap-learn-loop-phase-2-confidence-gated-search-bl, v0-5-3-learn-loop-phase-2-the-user-chose-queue-order-over-v0, post-v0-5-2-roadmap-decision-v0-5-3-or-v0-6-0]
---

**Phase-2 learn-loop batch shipped** (Tasks 194–212, each two-pass reviewed, stress 5/5):
- Task 194: Confidence-gated search blend + survival gate + anti-pattern conversion
- Task 209: State-labeled recall with `[superseded]`, `[expired]`, `[retracted]` tags
- Task 211: Query state-view gate for history questions
- Task 212: `cmk stats memory-health` instrumentation

**Release status**: Committed to main (green CI), CHANGELOG `[0.5.3] — 2026-07-14`, package bumped to 0.5.3

**D-248 Minor-boundary sweep outcome** (D-334): One triggered item found — Task 195 (cross-agent name decision for Cursor + Codex) — laned into v0.5.4

**Remaining action**: User approves `git tag v0.5.3 && git push origin v0.5.3` (auto-triggers publish.yml)

**Roadmap**: v0.5.4→v0.7.0 queue ready

**Why:** Phase-2 completion milestone. Task 195 lane assignment is critical for v0.5.4 planning. D-248 sweep outcome is durable project state.

**How to apply:** On v0.5.4 start, Task 195 is pre-laned and high priority. Know that minor boundaries include a backlog-sweep step. Only user go-ahead needed for tag push (per autopilot rules).
