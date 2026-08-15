---
id: P-E6JRSZa6
aliases: [P-E6JRSZa6]
type: project
shape: Timeless
title: 'Designer Handoff: Request Complete Files, Not Change Lists'
created_at: 2026-08-05T18:26:13Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f7dee2dce3999ded18d7f9656033fcab67a99dd1eb9a684822218583a1c62592
related: [stress-gate-required-before-pr-for-spawn-hook-boundary-chang, node-sqlite-fts5-module-availability-gate-for-task-141b-migr, whole-tier-flush-rule-for-context-directory]
---

When handing off design work to another designer, demand the complete revised file as output, not a list of changes. Include in the handoff prompt: "Give me the complete file, not a description of changes."

**Why:** Two prior design passes failed when structured as suggestions; the interpretation-in-between (translating suggestions to code) introduces failures. Complete files eliminate this step.

**How to apply:** State this constraint in all handoff briefs. Frame it as a deliverable format requirement, not an aesthetic preference. This is the critical control for usability.
