---
id: P-24J6aGWU
aliases: [P-24J6aGWU]
type: project
shape: State
title: Task Management Discipline (D-248)
created_at: 2026-08-07T20:09:39Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 49b6aee7476ed071efa52ac5dd2ceeb00d1466eeec262bb61a5178424d11f9fc
---

Every open task carries either a **lane** (assigned work in current release) or a **trigger** (a named, checkable condition for starting work).

Governance:
- Validator in `npm test` enforces that no task lacks both lane and trigger
- Backlog sweep runs every minor release, reviewing all trigger conditions
- Kill-or-commit rule: if a task crosses two minor releases without a trigger verdict, it must be killed or committed to a lane

Task Lifecycle:
- Task numbers assigned sequentially at filing, never reused; low number = old filing date, not staleness
- Tasks kept alive through re-verdicts (trigger refreshed at sweeps) and prior-art citations (validity elevated)
- Example: Task 180 re-verdicted twice, priority upgraded by two independent prior-art discoveries (caura-memclaw Forge, KiroCrew)

**Why:** Prevents backlog rot — valid long-term research tasks stay alive with explicit conditions, while zombie tasks without triggers/lanes are killed. Validator + sweep enforce discipline.

**How to apply:** Interpret old task numbers by checking lane+trigger, not age. For research tasks with long lead times, expect re-verdicts at sweep time and priority upgrades as supporting evidence emerges. If a task lacks both, npm test will catch it.
