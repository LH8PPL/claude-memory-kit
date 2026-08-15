---
id: P-XTLTaX5C
type: project
title: Decision-Journal View Gap — Now Task 147
created_at: 2026-06-12T12:30:31Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3478749919e4b31ba74a2096b24b3251e9e27953
related: [kit-feature-gap-chronological-decision-rendering, kit-produces-facts-not-views-the-decisions-md-gap, task-147-design-upgraded-the-kit-gets-a-standing-committed-c]
---

The kit currently provides:
- `cmk timeline` — per-fact history
- `recent-activity` — time-window view
- **Missing**: Chronological decision-journal view (what decisions were made, in order, with their whys)

Both squad's `decisions.md` journal and the kit's own `DECISION-LOG.md` (D-1…D-131, hand-maintained as source-of-truth) show this view is valuable enough that users build it by hand. Task 147 will add this view to `cmk digest`.

**Why:** User pattern discovery — manual decision journaling across multiple teams signals a real user need the kit doesn't yet meet

**How to apply:** Reference when scoping Task 147; the manual D-log is the existing pattern to validate against
