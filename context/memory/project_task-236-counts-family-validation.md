---
id: P-37MBHXA2
type: project
shape: Plan
title: 'Task 236: Counts Family Validation'
created_at: 2026-07-20T17:26:03Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: ce8b81bf5781ec0e7159176709fe2d120d736bd06b859735372a52801a4efb04
related: [v0-6-0-release-contents, v0-4-6-release-roadmap, doc-completeness-validator-hook-behavior-coverage-gap]
---

Task 236 closes v0.6.1 by covering the `counts` family on `validate-docs`, extending validator Task 186 (shipped in v0.6.0). Same file, same mental model. This addresses recurring drift in prose documentation claims (e.g. "12 MCP tools", "41 CLI verbs") that require ~6 manual fixes per release cycle. Task marked as "S" (small/straightforward).

**Why:** Automating count validation prevents silent documentation drift and eliminates recurring manual fix overhead. Good context locality with existing Task 186 implementation.

**How to apply:** When starting Task 236, reference Task 186's validator pattern/approach; sequence this as next work after Task 235 completes.
