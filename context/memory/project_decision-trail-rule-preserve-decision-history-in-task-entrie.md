---
id: P-ZQV3U4BP
type: project
title: Decision-trail rule — preserve decision history in task entries
created_at: 2026-06-12T12:43:49Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d4da24a83fe9f733af51c495e1e997b3b9be6309
related: [decisions-md-feature-using-standing-journal-design-pattern, project-decision-trail-lane-preservation-habit, architecture-decisions-recorded-in-adrs]
---

When recording decisions in task entries, preserve the original render-only shape to maintain the decision history trail. This shows how decisions evolved, not just the final state.

**Why:** Future sessions need to understand decision evolution and rationale; decision trails prevent design context loss

**How to apply:** When closing or documenting a decision task, include the original render (even if marked render-only) to show the complete decision history
