---
id: P-LBPZAUVF
type: project
shape: State
title: CMK search scope limitation with decision queries
created_at: 2026-07-14T12:47:38Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 98121e80e3b0239d23b558abf2e6243b93394e7a64d52e579d8b652af95c1734
related: [fts5-tokenization-quirk-with-version-identifiers, d-343-disposition-cmk-install-scaffold-refresh-bug-task-230, false-embedder-unavailable-alert-on-scope-decisions]
---

Running `cmk search --scope decisions` on v0.5.3 returns no results for name-history queries, even though ADR-0012 and decision records exist. Full trail is in ADR-0012 and tasks.md.

**Why:** Future session might assume no name-decision history exists if relying only on search.

**How to apply:** For name-change history, use ADR + tasks.md. Note as potential enhancement: index decisions by default or improve scope-search discoverability.
