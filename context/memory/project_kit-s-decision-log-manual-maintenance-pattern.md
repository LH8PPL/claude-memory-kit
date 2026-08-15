---
id: P-7RQTaMU4
type: project
title: Kit's Decision Log — Manual Maintenance Pattern
created_at: 2026-06-12T12:19:55Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 1086833c40909af72b1de1ed637db1bb46e6e52f
related: [kit-feature-gap-chronological-decision-rendering, decision-journal-view-gap-now-task-147, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

The claude-memory-kit build repo maintains `DECISION-LOG.md` (entries D-1 through D-131+) as a chronological decision journal. This predates the kit's ability to dogfood itself and remains the authoritative record of decisions; the kit's memory system provides recall over it. Manual editing has kept it a first-class artifact.

**Why:** Both the kit team and peer projects (Squad) independently maintain chronological decision journals, suggesting this narrative form provides value that individual-fact storage doesn't. The kit chose to keep D-log authoritative rather than migrate to the fact model.

**How to apply:** When evaluating a decision-journal feature (digest extension or new view), use D-log's structure as proof of concept. Understand why the kit team hasn't migrated from manual maintenance—that informs design tradeoffs for auto-rendering vs. hybrid approaches.
