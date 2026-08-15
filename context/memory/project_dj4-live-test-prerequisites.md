---
id: P-XCN5JURQ
type: project
title: DJ4-Live Test Prerequisites
created_at: 2026-06-18T05:12:14Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 77f33c0c5bf072816f71298cb6337b29e558e334005dcbe9f0e15785564c492c
related: [june-17-11-12-build-decisions-scope-implemented, mcp-server-staleness-gotcha-d-80, dj4-live-gate-test-passed-v0-3-3-headline-feature]
---

Before testing DJ4-live (journal-scoped search), ensure:
- `cmk digest` has been run in the live project to generate `context/DECISIONS.md`
- Claude Code has been restarted after any MCP reinstall (old processes serve stale binary)
- Test against a superseded decision (e.g., "did we reject anything for the chat topology — what and why?") to exercise the journal scope

**Why:** Without DECISIONS.md, `mk_search {scope:"decisions"}` has nothing to return; restarting picks up the current build and avoids stale-process masking; testing against a retracted decision exercises the journal's unique value over fact-based recall

**How to apply:** Before DJ4-live re-test, run `cmk digest` in the project, kill stale MCP processes (or restart Claude Code), then ask Claude about a decision you know was rejected
