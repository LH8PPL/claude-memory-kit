---
id: P-ZVZ5a6RK
type: project
title: Retracts and forgets are semantically distinct
created_at: 2026-06-16T11:25:54Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 4a7b70e77160a69fb13c1ce838d04279ecfc91ca38221ed3ade5d9e890f162b9
related: [automatic-recall-never-reads-tombstones-recovery-is-human-on, tombstone-auto-recall-design-decision, frozen-decision-log-philosophy]
---

- **Retract**: A decision that changed (e.g., "we decided X, then decided Y instead"). Record in DECISIONS.md journal with the full trail. Agents should see the history of changes.
- **Forget**: A fact deleted (tombstoned). Becomes invisible to agents. If you want to preserve "we considered X and rejected it" as part of the record, use a retract in DECISIONS.md, not a forget.

**Why:** These two deletion modes serve different needs. Retracts preserve the story of how decisions evolved (important for continuity). Forgets remove visibility entirely (important for cleaning up unwanted facts). Conflating them leads to either losing decision history or accidentally auto-recovering deleted facts.

**How to apply:** When deleting a fact, first ask: Is this a **decision change** (use retract / DECISIONS.md) or a **visibility deletion** (use forget / tombstone)? Choose the tool that matches your intent. This ensures recovery paths are correct (retracts can be re-read; forgets require explicit human action to restore).
