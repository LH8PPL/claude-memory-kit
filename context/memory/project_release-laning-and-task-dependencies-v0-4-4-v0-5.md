---
id: P-MMY4ESK6
type: project
title: Release Laning and Task Dependencies (v0.4.4 + v0.5)
created_at: 2026-06-28T20:50:10Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 03d5324e3a7613786badf95fec88f3ecd82df94cab3bbbaa4a3a3460864ee791
related: [concurrent-write-race-task-146-severity-tied-to-agent-multip, 13-stuck-tasks-categorization-and-supersession-map, v0-4-4-and-v0-5-0-build-phases]
---

**Core assignments:**
- Task 66 (temporal-validity engine, "wow #3" feature) → v0.4.4
- Task 59 → folds into 66 (no standalone version)
- Task 95 (re-curation) → post-v0.4.4, depends on 66 existing

**Merges & re-laning:**
- Task 96 + 130 → merge into one (versioning + redact compliance), re-lane to v0.5
- Task 70 → split by risk/cost: 70.4 (cheap, safe) as patch; 70.1/70.2 (medium cost, conflicts); 70.3 (risky/may be impossible in Claude Code)

**Concurrent work:**
- Task 146 (concurrent-write race) → version-on-cut with cross-agent work; race theoretical today, real when agents multiply

**Why:** Task assignment clarity prevents blocked work and surprises at release boundaries. Task 150 validates the principle: "design first, version second" prevents silent failures.

**How to apply:** Update release plan doc and CLAUDE.md task metadata with these laning decisions. Consult this as canonical source when prioritizing work.
