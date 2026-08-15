---
id: P-K6GWAA44
type: project
title: INDEX.md is a committed human-readable artifact
created_at: 2026-06-14T07:37:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5aacf258bb70b25297a7c7e5da3a17d9c253e617
related: [task-147-design-upgraded-the-kit-gets-a-standing-committed-c, avoid-duplicating-authoritative-docs-in-temp-locations, version-snapshot-in-recent-md-guards-against-cross-session-a]
---

- INDEX.md is the authoritative index of fact files in the project
- It is committed to git and travels with the clone
- It is a FEATURE, not a disposable cache

**Why:** INDEX is part of the project's shipped state; users rely on it staying current and human-readable

**How to apply:** Treat INDEX.md as first-class; do not gitignore; keep it synchronized with actual fact files via cmk doctor or reindex
