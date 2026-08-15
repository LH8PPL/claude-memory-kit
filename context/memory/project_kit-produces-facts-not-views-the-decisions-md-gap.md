---
id: P-HC3VHHET
type: project
title: Kit Produces Facts, Not Views — The DECISIONS.md Gap
created_at: 2026-06-15T16:26:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: da49a9d7c88cd0f9e778d292117da7d2ed48b89604539de32691116694efbba4
related: [decision-journal-view-gap-now-task-147, task-147-design-upgraded-the-kit-gets-a-standing-committed-c, regenerated-surfaces-vs-append-only-surfaces-digest-vs-decis]
---

- Kit's 211 facts are scattered per-file, each with title/Why/How/timestamp, but no assembled chronological view
- INDEX.md is flat/alphabetical, MEMORY.md is bounded (rolls over), cmk search is pull-based (requires knowing what to search)
- DECISION-LOG.md and squad's decisions.md both provide a *chronological decision view*: one readable page, in order, with why
- Kit lacks this view layer; raw facts exist but aren't assembled into a readable journal

**Why:** Clarifies Task 147 scope — DECISIONS.md is *not* redundant with existing docs; it's the *missing view* that the kit's facts should feed into. Distinction: kit = facts, DECISION-LOG/squad = views.

**How to apply:** Build DECISIONS.md as a derived, regenerated decision journal (not append-only) that assembles facts into a readable timeline. Also consider cmk digest as a sibling all-knowledge render.
