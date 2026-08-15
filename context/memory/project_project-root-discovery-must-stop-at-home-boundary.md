---
id: P-5YNFGAUM
type: project
title: Project Root Discovery Must Stop at $HOME Boundary
created_at: 2026-06-26T11:36:40Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: e5b736498fb1f072f238f20a0895729c7b16f1fe760eaf89fcfeb2dfb54b4501
related: [extract-shared-discovery-logic-to-prevent-drift, kiro-cli-env-passing-limitation, degradation-messaging-pattern]
---

The discovery walkers (`discoverProjectRoot`, `resolveMcpProjectRoot`) previously could escape into `$HOME` if a stray `~/context/` existed elsewhere.

**The bug**: `cmk mcp serve` from `/tmp/foo` could serve the wrong project if `~/context/` existed.

**The fix**:
- Both walkers now stop at `$HOME` 
- `CLAUDE_PROJECT_DIR` env var can override/customize
- `context.local/` is now recognized for local-only projects

**Why:** This was a real footgun: project discovery should be contained within its own tree, not escape upward into unrelated user directories.

**How to apply:** When reviewing discovery logic or adding new walkers, ensure they respect the `$HOME` boundary and use `CLAUDE_PROJECT_DIR` override semantics.
