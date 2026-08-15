---
id: P-VVUK5RU7
type: project
title: 'Task 159: Auto-Updating Decision Journal'
created_at: 2026-06-18T06:53:08Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 503e9c57c734cac598c71813a9bb8b4a53e3271ae04584af754cf95f8267c34e
related: [memory-kit-index-file-index-md-architecture, journal-staleness-check-uses-index-md-mtime-proxy, project-dogfooding-principle-use-kit-s-own-mechanisms]
---

**The task:** DECISIONS.md (the decision journal) should update itself automatically — every decision captured without manual intervention.

**How it works:** At session start, check whether new decisions exist. Instead of stat-ing 307 individual fact files (130ms overhead), use INDEX.md (the kit's metadata index) as a cheap proxy. If INDEX.md is newer than the last run, refresh the journal.

**Why it matters:** The journal is a core artifact. Automating it means it stays current as a true project record.

**Why:** v0.3.3 release blocker. Manual decision logs don't scale; automation keeps the journal honest.

**How to apply:** The perf optimization is sound — INDEX.md is maintained by the kit on every fact save. Trust it. At session start, check INDEX.md's timestamp to detect new decisions, then refresh the journal entries.
