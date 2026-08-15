---
id: P-SZX5LG7P
type: project
title: MCP Server Staleness Gotcha (D-80)
created_at: 2026-06-17T21:27:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 39c9c9c9d2c435de62139b2376917ff421bc5e4379d3a0da716f91b7383216e4
related: [mcp-serve-is-long-lived-restart-after-rebuild-or-you-test-st, stale-mcp-process-workaround-after-build-updates, dj4-live-gate-test-passed-v0-3-3-headline-feature]
---

When `cmk` is reinstalled during development, the long-lived MCP server process (`cmk mcp serve`) continues running the old binary. Reinstalling updates the CLI but does not restart the server. Result: live sessions query a stale server returning `unknown-scope:decisions` (or other scope-related errors) even though the feature is implemented in the current build.

**Why:** Affects feature testing and verification during development, especially when iterating on schema or scope changes. First encountered during DJ4 (v0.3.3 headline feature) testing on Jun 17.

**How to apply:** Recognize the symptom (feature works in source but returns unknown-scope in live session). Check `cmk doctor` for MCP freshness. Restart Claude Code to bind the next session to the current build. Add "restart Claude Code after reinstall" to cut-gate guides.
