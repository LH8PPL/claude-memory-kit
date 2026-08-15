---
id: P-UB6G75DX
type: project
title: 'Kiro Bug #5873 — Explicit Tool Route Blocked'
created_at: 2026-06-24T16:27:19Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 7017b24a5e8624c65d426131533f38b6ef626381c87cb9a713ae31010d2f4e58
related: [kiro-cli-memory-integration-test-procedure, memory-routes-by-execution-surface, kiro-bug-5873-blocks-manual-mk-remember-tbktt7fs]
---

Kiro bug #5873 prevents `mk_remember` tool calls from executing inside kiro-cli.
Workaround: route memory capture through CLI (`cmk remember`) instead.

**Why:** Tool is unavailable; CLI workaround is functional and documented.

**How to apply:** kiro-cli uses CLI route for memory capture. Document as Kiro workaround; clean up when Kiro fixes bug #5873.
