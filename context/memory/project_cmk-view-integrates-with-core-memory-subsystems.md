---
id: P-VDAQL5YB
type: project
shape: Relationship
title: cmk view integrates with core memory subsystems
created_at: 2026-08-02T08:27:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 206c4faf75d11fd99a98c83230dc1e0cef39fba696e4a67769e05fcae0045a0d
related: [cmk-view-purpose-and-headline-use-cases, task-255-design-grill-questions-queued, research-based-claims-discipline]
---

The viewer depends on and surfaces data from four internal systems:
- Task 232: supersession chains (which facts replaced which)
- Task 250: health-log warnings (memory health signals)
- Task 233: fire-rate telemetry (how often facts are recalled)
- The conflict queue (facts awaiting human resolution)

These appear in the UI as kit semantics: trust tier as color, supersession as directed edges, etc.

**Why:** The viewer is not a standalone UI; it's the surface over the kit's data model. These subsystems must be complete and working correctly for the viewer to provide value.

**How to apply:** When implementing the viewer, treat Tasks 232, 250, 233 and the conflict queue as integration points. They define what data the viewer can show and how it should be rendered.
