---
id: P-FWFK4ARZ
type: project
title: Documentation-map Spine drifts while DECISION-LOG stays current
created_at: 2026-06-18T07:05:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3b96d724f4f1d8e89140081b6b3ce28bfdc4e265b7a1696e5d63e3d8a9ab6fde
related: [project-tracking-structure, follow-the-doc-procedure-route-dont-narrate, paper-trail-convention-tasks-md-as-single-source-of-truth]
---

The project designates `specs/tasks.md` "▶ Current state — what's next" as THE single source of "where are we and next action" per the documentation-map. In practice: when releases ship, the DECISION-LOG breadcrumb updates (currently knows v0.3.3 + Task 159 in progress) but the Spine does NOT (still states v0.1.2 shipped, v0.2 in progress). Releases v0.2.0, v0.2.3, v0.2.4, v0.3.0, v0.3.1, v0.3.2, v0.3.3 shipped without Spine update. Cold-start reads get wrong mental model; worse, the documented authoritative source disagrees with the actual authority.

**Why:** Drift occurs because releases are cut and documented elsewhere without proactively refreshing the Spine. This repeats the same error class as Task 159 triplication and cut-gate-as-journal — state in multiple places, not maintained in the designated home.

**How to apply:** Establish a release procedure: before shipping, update the Spine "Current state" section (and other Spine sections that reference state) to match DECISION-LOG. Alternatively, during cold-start in next session, refresh the Spine to restore documentation-map integrity.
