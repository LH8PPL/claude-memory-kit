---
id: P-UTBXMFWR
type: project
title: 'June 17 11:12 Build: decisions Scope Implemented'
created_at: 2026-06-17T21:27:12Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f912966f957dace6d0be8053bfbe2044165b2b25cf85543c2b472f74c7190977
related: [dj4-live-gate-test-passed-v0-3-3-headline-feature, dj4-live-test-prerequisites, mcp-server-staleness-gotcha-d-80]
---

Current installed `cmk` binary includes: (1) zod enum validation for search scopes (including `decisions`), (2) `DECISIONS.md` support with `decision (retracted)` status, (3) `cmk search --scope decisions` query support. Stale MCP processes from Jun 15 predate this build and block scope resolution.

**Why:** Distinguishes current-build capabilities from stale-process behavior when testing scope-based features.

**How to apply:** When testing decision-scope features, verify MCP process is current via `cmk doctor` or by restarting Claude Code.
