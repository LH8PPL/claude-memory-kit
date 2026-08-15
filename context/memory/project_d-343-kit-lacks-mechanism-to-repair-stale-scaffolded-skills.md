---
id: P-SNMWHBJT
type: project
shape: Absence
title: D-343 — Kit Lacks Mechanism to Repair Stale Scaffolded Skills After Update
created_at: 2026-07-15T19:04:52Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4f771292cc77a6590a2c092b3d4fa8c2f71c0b178c81c8ac8260ecaaf647050e
related: [cmk-install-skips-existing-files-cannot-repair-stale-skills, scaffolded-skills-drift-after-binary-updates-without-cmk-ins, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

The kit has no command (e.g., `cmk repair --skills`) to fix skills that become stale when templates are updated. This is a general gap: cascading updates are not automated.

**Why:** Without this, updates to shipped skill templates don't propagate to existing scaffolded instances. Manual intervention is required, defeating the kit's purpose.

**How to apply:** Propose D-343 as a forward fix; in the meantime, document the limitation and offer template diffs + manual copy as the workaround.
