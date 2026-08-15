---
id: P-YLDXYKFH
type: project
title: Design Discipline — Keep Systems Whole
created_at: 2026-07-01T21:21:06Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 89b89f6bb150acbef9dc7819b672fde6ccaa970b0b09d432f699532a76a32286
related: [kit-design-methodology-current-state, project-philosophy-niche-excellence-over-breadth, decision-logging-in-task-entries]
---

Do not decompose whole-system designs into backlog fragments (scattered tasks, deferred ADR sections, deferred decisions). The synthesis act itself must stay whole and complete.

Fragmentation loses the system view; constraints that only appear at integration scale get missed. Designs must be specified completely, once, with all wires visible.

**Why:** The decomposition pattern — turning "design the closed loop" into "wedge tasks + ADR sketches + later decisions" — is a reflexive failure mode. It prevents the design from being reviewed, challenged, or finalized as one artifact.

**How to apply:** When designing a system, keep it integrated until it's finished and reviewable. Only after the complete design is approved does work decompose into a build order.
