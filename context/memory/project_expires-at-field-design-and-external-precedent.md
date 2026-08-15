---
id: P-NUTKEA6V
type: project
title: Expires_at Field — Design and External Precedent
created_at: 2026-07-02T08:40:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ca11b7f231c418d15233cd43930f4e16a1cf70bd13a3081b48359521bfa42150
related: [expiry-mechanism-precedents-anti-patterns, task-66-3-scoped-population-enforcement-both-required]
---

- **Location**: Defined in design.md §4, never implemented
- **External precedent**: mem0 (TTL on memories), MemPalace/Zep (validity windows), internal consolidator (14-day staleness drop)
- **Direction**: Convergent support; mechanism (sweep) is trivial; gap is *population*

**Why:** Expiry/TTL is well-validated across tools; the risk isn't the idea but whether it gets populated. This context justifies 66.3's population-focused design.

**How to apply:** Use as background for 66.3 justification; focus entirely on *how to populate* the field (auto-extract, explicit flag, real workflow validation).
