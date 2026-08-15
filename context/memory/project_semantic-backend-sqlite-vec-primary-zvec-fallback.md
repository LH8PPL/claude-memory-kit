---
id: P-Aa22MJAC
type: project
title: 'semantic backend: sqlite-vec primary, zvec fallback'
created_at: 2026-06-10T07:22:00Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 98c05b7b6361af89b0ea93a1e06037b5bb0c102f
related: [node-sqlite-fts5-module-availability-gate-for-task-141b-migr]
---

sqlite-vec is the primary Layer-5b backend candidate; alibaba/zvec is the NAMED fallback

**Why:** sqlite-vec puts vectors inside the SQLite index the kit already runs (one store, design 9.3.1 fit); zvec is embedded+Node+Windows but its bindings are only ~May-2026 old

**How to apply:** spike better-sqlite3 loadExtension on Windows first; if it fails, zvec replaces it without re-opening the decision; either way zvec gets a cheap bake-off rung
