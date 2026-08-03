---
id: P-7TFXEEXP
aliases: [P-7TFXEEXP]
type: project
shape: Event
title: Task 260 Viewer Visual Redesign — Completed & Verified
created_at: 2026-08-03T17:29:09Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3d58461ba97591c981cf4ec7d632aa6bdf9fabf7af35e04df661e39ec2933569
---

**What changed:**
- Card text: 15px semibold titles + muted body, clamped to 760px measure (was 1040px undifferentiated text)
- Badges: tinted fills instead of outlines (readable as categories, not visual noise)
- Surfaces: warm ground (#1a1916 dark, warm light mode), white cards on distinct surfaces
- Dark mode: bespoke warm palette, not inverted greys
- Graph: 160 orphan nodes removed, hub labels with readability halos, red supersession arrows pointing to successors, legend added, footer shows undrawn count ("160 unlinked, not drawn")
- Type hierarchy, spacing rhythm, header, health strip shape refined

**Verified:**
- All automated gates green (3916 tests, 5/5 stress, 25/25 live-verify)
- Zero new dependencies added
- Live deployment does not affect other behaviors

**Known scope limitations (acknowledged by implementer, not regressions):**
- Bullet list rendering (e.g., `- A - B - C`) comes from server payload, intentionally not touched in this pass — follow-up material
- Graph labels still overlap where hubs park close
- Warm beige surface color is a taste choice, tunable if cooler tone preferred

**Reviewer focus areas:**
- Markdown tokenizer security (XSS on untrusted fact bodies)
- Accessibility contrast (both themes)
- Behavioral correctness (untouched)

**Why:** This pass was a major visual overhaul with strict constraints (zero new deps, all tests must remain green); completion gates verification and acknowledged trade-offs matter for understanding the current viewer state and what remains polish.

**How to apply:** When modifying the viewer in future sessions, recall which visual choices were taste calls (surface color), which are known tech debt (label overlap, bullet rendering), and that tokenizer changes require security review.
