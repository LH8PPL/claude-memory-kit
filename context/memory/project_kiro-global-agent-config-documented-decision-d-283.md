---
id: P-RSGPA3BJ
type: project
shape: Event
title: Kiro Global Agent Config Documented (Decision D-283)
created_at: 2026-07-06T14:59:35Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: b0a304089a1355d9c7a30e4e4228978019241e91051a2647f91df2415fc8a385
related: [kiro-cli-agent-resolution-requires-global-default, kiro-agent-must-be-global-empirically-validated, kiro-agent-configuration-local-and-global-support]
---

The decision to use global agent config for kiro-cli was previously undocumented and appeared to be a potential bug. Investigation (prompted by user's "did you check the docs?" challenge) confirmed the behavior was correct; merged decision record + primary-source comment to main.

**Why:** Undocumented architectural constraints can be misread as bugs and trigger unnecessary code changes. Documenting the rationale prevents future re-opening.

**How to apply:** Reference D-283 if the global config is questioned. The constraint is permanent.
