---
id: P-C5SL7RaW
type: project
title: Journal Staleness Check Uses INDEX.md Mtime Proxy
created_at: 2026-06-18T06:55:13Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: edc29efc61b1253f9d3d526b2871e6e58df64f02b23311ffdddd3c208ea0520d
related: [task-159-auto-updating-decision-journal, memory-kit-index-file-index-md-architecture, index-md-is-a-committed-human-readable-artifact]
---

Perf optimization discovered during self-review. Initial implementation checked mtime of newest `type:project` fact (130ms). Changed to check only `INDEX.md` mtime (instant) because CMK already maintains INDEX.md on every save. This proxy is authoritative without iterating all 307 fact files.

**Why:** Session-start budget is tight; INDEX.md is a required artifact maintained by kit infrastructure anyway.

**How to apply:** `isJournalStale()` compares DECISIONS.md mtime vs INDEX.md mtime. If journal is older, sync runs on session start.
