---
id: P-6KHEFURB
type: project
shape: Plan
title: Task 201 — Cross-Agent CLI Selection for Memory Operations
created_at: 2026-07-05T17:13:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a5096ce7c8bbaaa38da6495f9e55cd4392ee4032adb38a834d0676a75fcdd59e
related: [cost-role-agent-separation-principle-use-g9tg4ggc, field-survey-zero-multi-cli-routing-32-projects]
---

Enable users to specify a different agent's CLI for automatic memory operations than the one used for primary coding.

**Example:** Use Claude (IDE/primary coding) but run memory extraction through Kiro CLI (cheaper/background tasks).

**Implementation scope:** One config key (`backend.agent`) + doctor validation + docs.

**Foundation:** `makeBackend` factory already designed override-ready (Task 200).

**Novelty:** No other surveyed projects (n=42 across 5 waves) support cross-agent CLI selection.

**Why:** Enables cost/role separation — premium agent for interactive work, cheaper agent for scheduled background janitor tasks. Zero-friction implementation via existing factory pattern.

**How to apply:** Implement `backend.agent` config key parsing in `makeBackend`; add doctor validation line; document in setup/config guide.
