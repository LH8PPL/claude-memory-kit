---
id: P-2FLXAQSN
type: project
shape: State
title: cmk install output is minimal, shows only essential information
created_at: 2026-07-12T12:59:04Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 84e0ac8668b49b430c4f735afa135736e4e3684045157080e8f3b5822b069976
related: [better-sqlite3-eperm-cleanup-warning]
---

**Shows:** package count (added/changed), install completion status, activation reminder, config guidance (native memory behavior, semantic recall enablement)

**Omits:** npm deprecation warnings, MCP server PID list, npm funding notices

**Why:** Users need to know installation succeeded and how to activate it. Pre-emptive advisory noise doesn't help; real recovery messages surface at error time when needed.

**How to apply:** Enforce this design in install command; if verbose output reappears, treat as regression.
