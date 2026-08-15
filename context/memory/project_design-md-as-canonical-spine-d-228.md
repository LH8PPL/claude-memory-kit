---
id: P-W6YDZZYN
type: project
shape: Timeless
title: design.md as Canonical Spine (D-228)
created_at: 2026-07-22T08:52:23Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 643a5a708156faf6a0e22051c7c1e8a96ac5c8063eb8063218a726ee1922b742
related: [memory-tier-at-1-949-facts-index-md-capacity, link-out-convention-for-design-md-evidence, ci-authority-convention]
---

D-228 kernel decision establishes design.md as the single canonical architecture mechanism doc. Explicitly forbids spinning up separate `docs/design/` files. Size (429 KB, 3777 lines) is intentional comprehensiveness, not cruft.

**Why:** Prevents architectural fragmentation; maintains unified source of truth.

**How to apply:** When planning doc cleanup or architecture work, preserve design.md as one monolithic doc. Route all design decisions there.
