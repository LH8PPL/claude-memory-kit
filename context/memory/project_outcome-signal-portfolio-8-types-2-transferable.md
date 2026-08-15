---
id: P-DXX9SWFN
type: project
title: Outcome Signal Portfolio (8 Types, 2 Transferable)
created_at: 2026-07-01T15:33:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a48a884aa34d5cfb6092be3a7bf450707831d4eb5a604fd92b2dc4e1e2fc5ccb
related: [signal-portfolio-for-learning-loop-in-claude-code-ide, automatic-oracle-free-quadrant-is-the-real-design-target]
---

- **Strong + not-failure-only:** Tool-result/exit-code after recall; `/goal` acceptance-criteria pass/fail
- **Strong + failure-only:** User correction; `cmk forget`
- **Moderate:** Recalled-but-re-searched; Fact-injected-but-used; Contradiction between facts
- **Weak (trap):** Recurrence/re-statement of rule (Task 181 catch — friction, not reinforcement)

The two strong + non-failure signals both exist in Claude Code today and are **unconnected to memory**.

**Why:** Identifies the implementable wins and the deceptive signals to avoid.

**How to apply:** Prioritize wiring tool-result and `/goal` signals into retrieval ranking; flag recurrence as observational noise, not learning.
