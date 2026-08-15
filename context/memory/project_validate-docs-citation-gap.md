---
id: P-E4U9NH6W
type: project
shape: Absence
title: validate-docs Citation Gap
created_at: 2026-07-21T13:59:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 67e180540d3f96e197aeec5a04f6e3d9221b045d742ec98ee092e158d3a92ac2
related: [validator-gap-d-nnn-decision-log-citations-not-enforced, decision-log-validation-gap-d-nnn-ids, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

The `validate-docs` system structurally enforces citation patterns for `ADR-NNNN`, `FR-N`, `Task N`, and `§N.N`. However, it does NOT validate decision-log IDs (`D-nnn`), allowing them to drift undetected. This contradicts the project's thesis that prose rules should not rot.

**Why:** Systematic validation is core to the project's argument; this gap leaves a category of citations unguarded.

**How to apply:** Extend `validate-docs` to check `D-nnn` patterns, or explicitly document why they are excluded.
