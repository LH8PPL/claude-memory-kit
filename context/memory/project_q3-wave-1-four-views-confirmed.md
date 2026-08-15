---
id: P-KT3V7FLR
type: project
shape: Plan
title: Q3 Wave-1 — Four Views Confirmed
created_at: 2026-08-02T08:30:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a6d78ccae8895e2517f359e30639ab02b2ca1c55cc715b0167d185f22edd6910
related: [q3-wave-1-viewer-five-views-locked, cmk-view-proposed-wave-1-design, q2-landing-design-search-first-locked]
---

- **Landing:** From Q2 design (search + health strip + view tabs)
- **Fact detail:** Full body + Why/How + trust history + source session/date + edge list (citations, supersessions) + CLI commands (`cmk forget <id>`, `cmk trust <id>`)
- **Graph tab:** Full graph with trust as color, supersession as direction, anchors as hubs
- **Health tab:** 14 health checks + active registry warnings
- **Deferred:** timeline (cmk recent covers), conflict-queue UI (health strip shows count), stats page (health strip carries priority metrics)

**Why:** These 4 views offer unique kit-specific value without duplicating existing CLI or covering rare edge states. User confirmed (2026-08-02).

**How to apply:** Prioritize these 4 views for Q3 wave-1 implementation; hold all others deferred.
