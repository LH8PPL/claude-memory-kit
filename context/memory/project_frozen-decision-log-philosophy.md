---
id: P-KWGTaLYN
type: project
title: Frozen Decision Log Philosophy
created_at: 2026-06-25T13:15:21Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f55759e149852267113b6a61a581fe4888c9ff7902e2e6fe800085ea5bb851a7
related: [project-governance-adrs-frozen-records-and-two-phase-rename, project-decision-trail-lane-preservation-habit, retracts-and-forgets-are-semantically-distinct]
---

Historical records (DECISION-LOG, ADRs, research notes, completed-task records) are preserved as frozen point-in-time snapshots. They are NOT updated when facts change.

When an **operational document's** value changes (e.g., a file path, config setting, process step), historical docs referencing the old value are left as-is. Instead, the **operational document** includes an inline note explaining the change (e.g., "superseded detail: it was X, moved in D-198").

This preserves both current state AND rationale for changes, helping future readers understand how the project evolved.

**Why:** Decision logs and research are records of *thinking at a point in time*; rewriting them erases that history. Inline change notes in operational docs serve future readers without corrupting the audit trail.

**How to apply:** When a documented value/process changes, add a "superseded detail" note to the operational doc. Leave historical records alone. This keeps the full arc visible.
