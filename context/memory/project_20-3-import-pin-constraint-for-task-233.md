---
id: P-CDRKH6WB
type: project
shape: State
title: §20.3 Import-Pin Constraint for Task 233
created_at: 2026-07-22T19:24:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0b9d3c8a3dc42f1587ef646d8457436aaf07906cf0fb030d817ae60dba06039a
related: [test-suite-isolation-guard-required-known-risk, regression-test-pinning-on-bug-fixes, youtube-to-slide-foreign-format-fact-file-pre-existing-not-r]
---

The snapshot builder must not import the sqlite index. This is a structurally-pinned invariant; failure to observe it could silently break the design.

**Why:** The hint build composes three pieces (FTS5-backed hint, existence advertisement, Memora refinements). The import-pin is the one place the build could break a hidden structural requirement without obvious failure symptoms.

**How to apply:** When reviewing the implementation, verify the snapshot builder does NOT import the sqlite index. Call this out explicitly in code review if the implementer's design introduces any cross-layer imports.
