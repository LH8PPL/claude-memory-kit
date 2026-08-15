---
id: P-7FM6NVP4
type: project
title: 'Skill composition pattern: scaffold + allow-list must be updated together'
created_at: 2026-06-11T09:57:30Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f3a97378fb692376633e829c126941865b4003d7
related: [allow-list-entries-centralized-in-settings-hooks-mjs, kit-install-pre-configuration-expectation, scaffolded-skills-drift-after-binary-updates-without-cmk-ins]
---

Adding new skills requires updating both the skill scaffold code (e.g., Task 75.1 for memory-search) AND Task 90's `KIT_ALLOW` permission list. Omitting the allow-list entry causes the skill to prompt for permission instead of auto-firing. Task 75.1 had this bug; Task 133 fixed it with a one-line allow-list entry.

**Why:** Second occurrence of this composition pattern (memory-write in Task 90 was the first). This repeating bug class should be prevented in future skill additions.

**How to apply:** When scaffolding new skills, update both the scaffold creation and KIT_ALLOW in the same PR/task. After merge, run `cmk install --with-semantic` to apply permission changes idempotently.
