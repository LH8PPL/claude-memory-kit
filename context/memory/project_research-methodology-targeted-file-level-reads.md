---
id: P-MLHBNSDE
type: project
shape: Timeless
title: Research Methodology - Targeted File-Level Reads
created_at: 2026-08-02T08:23:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8bedeb8fa02684f341e423c1d323fede76b4cb9c28dd7ceaf2773287bba0beae
---

Research in this project uses targeted file-level inspection, not full repository clones.
- Load-bearing files are read from source (components, routes, build scripts, package.json, repo trees)
- Example: claude-mem project read App.tsx, Feed.tsx, ObservationCard.tsx, Header.tsx, ViewerRoutes.ts, SearchRoutes.ts, MemoryRoutes.ts, SessionRoutes.ts, SettingsRoutes.ts, DataRoutes.ts, build-viewer.js, package.json, and full repo file tree
- Sufficient depth for decision-making phases
- Full clones deferred to implementation phase when implementation details (SSE handling, port conflicts, etc.) matter

**Why:** Balances research efficiency against completeness; targeted inspection provides sufficient detail for architectural decisions without full clone overhead

**How to apply:** When researching design questions, fetch key architectural files from target projects; use file-level primary-source inspection; defer full shallow clones to build phase per the D-153 convention
