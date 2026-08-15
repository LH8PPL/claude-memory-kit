---
id: P-9F5aKB6J
type: project
shape: Timeless
title: Core Memory Kit Solves Discipline, Not Storage
created_at: 2026-07-18T14:11:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ffddc69f7c6f1926cef990f85a268820052bc7c9eeb1d127d0443a5d73c9c5cd
related: [kiro-cli-automatic-memory-capture-works]
---

The kit's core value is the systematic injection/capture/read/dedup discipline layer for agent memory. Files are cheap; the hard problems are:
- Reliable writes at injection points (turn events, session start, decisions)
- Reliable reads at the right trigger moments
- Deduplication (same issue not solved twice)
- Maintenance (stale entries, link hygiene)

Simple approaches (files alone, hooks alone, CLAUDE.md rules alone) fail because they lack systemic discipline enforcement.

**Why:** User's lived experience: started with simple files + hooks + rules, found Claude Code still didn't reliably remember/act. Kit emerged to solve systematic discipline.

**How to apply:** When presenting core-memory-kit, lead with discipline (reliable writes, reads, dedup machinery), not storage mechanism. The competitor is ad-hoc fragmentation, not "no memory files."
