---
id: P-CZTMNSVW
type: project
shape: State
title: Mandatory Trigger-Walk in D-248 Sweep and cut-gate Pre-Tag
created_at: 2026-07-03T20:21:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 63bcbcf9b09976e5845f08bf71755da6dbf5fb0cd6e31866e543ffda85d229b4
related: [minor-release-triggers-backlog-sweep, deferred-task-decision-gate-backlog-sweep-rule, minor-boundary-backlog-sweep-d-248-convention]
---

- **What**: Walk every named trigger (~39 total), ask "has this condition become TRUE?"
  - If fired: Lane the work OR re-verdict it explicitly (fired triggers cannot remain silently deferred)
  - If not fired: Keep trigger, refresh stale condition text
- **When**: Start of D-248 minor-cut sweep; mirrors as ★ pre-tag step in cut-gate.md
- **Documented in**: CLAUDE.md (D-248 step 3), cut-gate.md, D-267

**Why:** Enforces forcing function to actively monitor triggers. Prevents "lane everything" pattern (rejects fabricated commitments on conditional work; Cursor-slot precedent shows lanes slip). Enforces healthy lifecycle: trigger fires → then lane.

**How to apply:** v0.5.0 cut is first real exercise (check ~39 triggers' firing conditions); repeat for every subsequent minor cut.
