---
id: P-49SD2W3C
type: project
shape: Timeless
title: Self-Healing Pattern for Safe Operations
created_at: 2026-08-01T12:51:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6bf58ca2e91a6627bd0efe3a2168390632d809d94beedeee98125346759fe3a8
related: [architecture-decisions-via-adr-references]
---

- Safe failure classes heal automatically at the failure site, piggybacked on the operation that triggered them.
- Precedent: auto-extract self-heal (line 242), install auto-recover (line 248).
- Unsafe or destructive operations use confirm-first discipline (user approval before execution).

**Why:** Reduces noise for recoverable errors; reserves confirmation UX for risky actions (adheres to ADR-0018 "kit proposes, user owns").

**How to apply:** At failure: check class; safe = heal inline; unsafe = propose fix to user for approval before execution.
