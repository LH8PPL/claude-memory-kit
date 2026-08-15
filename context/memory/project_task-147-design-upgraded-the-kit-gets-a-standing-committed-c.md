---
id: P-aUDDN4WP
type: project
title: 'Task 147 design upgraded: the kit gets a STANDING committed context/DECISIONS.md'
created_at: 2026-06-12T12:43:26Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: ca5fa4e7957ccf2a1d5ce8d4a33ae3db0bccc2df
related: [kit-produces-facts-not-views-the-decisions-md-gap, decision-journal-view-gap-now-task-147, decisions-md-feature-using-standing-journal-design-pattern]
---

Task 147 design upgraded: the kit gets a STANDING committed context/DECISIONS.md journal (decision facts append at capture, writers-own-derived-views like INDEX.md), not just render-on-demand. The user's call 2026-06-12: 'our kit needs the decisions.md'.

**Why:** A standing journal puts each decision line in the PR diff that captured it (reviewable), travels with git clone, and needs no tooling to read - the same reasons the build repo hand-maintains its own DECISION-LOG

**How to apply:** Implement in Task 147 via the INDEX.md maintenance pattern (D-112/D-124 discipline); cmk digest keeps a --decisions render as the secondary view
