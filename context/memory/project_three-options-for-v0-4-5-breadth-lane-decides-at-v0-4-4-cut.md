---
id: P-JFLF6J7S
type: project
title: Three Options for v0.4.5+ (Breadth Lane Decides at v0.4.4 Cut)
created_at: 2026-07-02T07:43:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4ab594cc2f42c378361fbfeff58b38fca969d4a5bf07a1293ee419a0da98fbe6
related: [breadth-lane-stall-root-cause-four-consecutive-displacements, harness-support-roadmap-task-196-and-versioning-policy, committed-roadmap-v0-4-4-v0-5-0]
---

**Option A — Breadth First:** v0.4.5 Cursor → v0.4.6 Codex → ordered tail → then v0.5.
  - Pro: v0.4 gets its differentiator; more harness reach before naming decision.
  - Con: learn-loop waits behind adapters with no known user.

**Option B — Breadth On-Demand Post-v0.5:** Cursor + tail ship v0.5.x when real demand fires (user uses daily or asks by name).
  - Pro: no inventory; learn-loop opens sooner.
  - Con: breadth promise formally shrunk.

**Option C — Cursor Only v0.4.5, Tail On-Demand:** v0.4.5 Cursor (the committed agent), then v0.5 + demand-driven tail.
  - Pro: honors Cursor lock; breadth gets one more ship; learn-loop opens sooner.
  - Con: partial commitment.

**Hinges on:** Which harnesses (Cursor / Codex / tail) does the user actually use or want day-to-day?

**Why:** The stall had no clear signal about which adapters matter. Three options exist; the decision must be made explicitly with user input driving prioritization.

**How to apply:** At v0.4.4 cut, ask user which harnesses they'd use daily. Record the choice. If no clear answer, Option B (demand-driven) is the safest default to prevent further drift.
