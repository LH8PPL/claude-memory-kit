---
id: P-3BNDZFUW
type: reference
title: MCP serve is long-lived; restart after rebuild or you test stale code
created_at: 2026-06-16T11:17:54Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 9f6635458f4b0316f51d882053cdb8c3c796308b18d61d00fca28b1000d851e8
related: [mcp-server-staleness-gotcha-d-80, mcp-server-may-retain-stale-code-in-memory-after-package-upd, fresh-folder-verification-workflow-for-claude-memory-kit-rel]
---

Cut-gate / MCP-testing gotcha: the `cmk mcp serve` process is LONG-LIVED — Claude Code launches it once at session start and it does NOT reload when you rebuild/reinstall the cmk package. So after rebuilding the tarball mid-cut-gate, the CLI (`cmk search`, fresh process each call) runs NEW code but `mk_search`/`mk_remember`/all MCP tools run the STALE in-memory server. Symptom: a fix works via `cmk search` but the same query fails via `mk_search` (e.g. the FQ1 FTS5 sanitizer worked in CLI but mk_search still threw 'FTS5 parse error — no such column' because the running server predated the fix). NOT a kit bug — restart Claude Code (/exit then claude) to relaunch the MCP server on current code. Cut-gate gap: the FQ1 probe only tested `cmk search`, not the `mk_search` MCP tool; MCP tools are the surface users actually hit, so cut-gate FTS5/feature probes should also run through the MCP tools in-chat after a session restart.

**Why:** During the v0.3.2 cut-gate, mk_search threw an FTS5 error the CLI didn't — because the running MCP server predated the FQ1 fix. This wastes time looking for a non-existent bug and could mask a real one. The CLI-vs-MCP staleness gap is non-obvious and recurs every cut where code is rebuilt mid-session.

**How to apply:** After rebuilding/reinstalling cmk mid-cut-gate, RESTART Claude Code before testing any mk_* MCP tool — otherwise you're testing stale in-memory server code. When a fix works via `cmk <verb>` but fails via `mk_<verb>`, suspect a stale server first (restart), not a code bug. Add MCP-tool probes (not just CLI) to the cut-gate for FTS5/feature gates, run after a fresh session start.
