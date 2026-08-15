---
id: P-aFKRUUYV
type: project
title: D-163 Invariant — Agent Must Never See Forgotten Facts
created_at: 2026-06-17T06:58:44Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6e2a12481e07de79887b540fd4e6d8356553fb1f00b18d3e762b47a90d32479f
related: [contract-lock-testing-pattern, auto-recall-agents-are-blind-to-tombstoned-facts, read-path-inconsistency-get-lacks-deleted-at-filter]
---

Core privacy/integrity contract: the agent (via MCP or auto-call surfaces) must never be able to access a fact that was explicitly forgotten (`cmk forget`). Enforced by: `includeTombstoned` flag defaults to false (opt-in only), MCP surfaces never pass this flag, CLI-only `cmk get --include-tombstoned` exposes recovery.

**Why:** Agent leaking recovered forgotten facts would be a critical privacy breach; the invariant must be enforced by-default, not remembered.

**How to apply:** Any feature reading archive/tombstones directory must verify D-163 is respected; use contract-lock test pattern — assert the body never appears in agent-facing response text, not just that "error returned."
