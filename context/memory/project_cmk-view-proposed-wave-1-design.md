---
id: P-5QaU2CTC
type: project
shape: State
title: cmk view — Proposed Wave-1 Design
created_at: 2026-08-02T08:52:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce7cbb91f59bf55440caf99d73dc12aa647371099315ac53271b9f4bdeb37aa3
---

**Shape:** Ephemeral localhost server (loopback-only, free port, auto-opens browser, Ctrl-C stops).

**API & Architecture:**
- API-first routes: JSON + HTML from same route (datasette pattern)
- Mounts zero write routes; all writes via CLI (`cmk forget <id>`, `cmk trust <id>`)
- Copyable commands in the UI beside every fact

**Wave-1 Views:**
- Search-first landing page with pinned health strip
- Fact detail (body, Why/How, trust history, edges, source)
- Kit-semantic graph (trust as node color, supersession as edges)
- Health dashboard (14 doctor checks + active 250-warnings)
- Decisions journal (evolution log with struck-through superseded entries)

**Tier Support:** All three tiers (P/L/U) with badges and injection-precedence semantics. Per-view freshness labels (manual refresh in wave 1).

**Dependencies:** Zero new dependencies. Uses node stdlib `http`, one committed HTML file, vanilla JS, existing better-sqlite3 FTS.

**Deferred (Named Triggers):**
- Live-refresh via SSE: trigger = "habitual open-across-session usage OR first user ask"
- Timeline view
- Conflict-queue UI (count shown in health strip)
- Stats page

**Why:** Consolidated after Q1–Q5 design deliberation. Defines shape, scope, wave-1 priorities, and deferral criteria for implementation.

**How to apply:** Use as the specification for `cmk view` implementation. File each deferred feature as a separate task with its stated trigger at build time.
