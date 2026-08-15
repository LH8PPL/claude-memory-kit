---
id: P-CXADBWXH
type: project
shape: Plan
title: 'Q3 Wave 1 Viewer: Five Views Locked'
created_at: 2026-08-02T08:34:01Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7e1c3070054bc3008152c9d04c18df5bd4126403c4b624a1cae31dcd63ed0d5c
related: [q3-wave-1-four-views-confirmed, cmk-view-proposed-wave-1-design, cmk-view-purpose-and-headline-use-cases]
---

**Views shipping in wave 1:**
1. **Landing** — search box + health strip + newest facts (trust · date · source).
2. **Fact detail** — body + Why/How + trust history + source session/date + graph edges, with copy-able `cmk forget`/`cmk trust` commands.
3. **Graph** — semantic graph: trust as color, supersession as direction, anchors as hubs.
4. **Health tab** — doctor's 14 checks + active warnings from registry.
5. **Decisions tab** — decision journal (context/DECISIONS.md) rendered chronologically (newest first), superseded/retracted entries struck through to show evolution. Search within tab scopes to decisions.

**Deferred:** Timeline (CLI tools sufficient) · Conflict-queue UI (rare; health strip covers it) · Stats page (nice-to-have).

**Why:** Locked scope baseline for Q3 implementation — prevents scope creep and gives clear ship list.
**How:** Use as the build/design/acceptance scope. Out-of-scope requests default to "deferred" unless reprioritizing one of these five.
