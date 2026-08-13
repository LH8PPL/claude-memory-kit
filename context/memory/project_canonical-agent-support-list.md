---
id: P-NGCNZMFJ
type: project
shape: State
title: Canonical Agent Support List
created_at: 2026-07-15T13:53:15Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: dd1ea1100772c960bfd9523373dfcb3c7e6619fcb51a29e7573915c49819dfce
related: [github-metadata-sync-pattern, documentation-structure-and-prerequisite-locations, v0-5-2-release-complete]
---

The project supports and must mention across all metadata locations:
- Claude Code
- Kiro
- Cursor
- Codex

GitHub About description should state "Persistent per-project memory for Claude Code, Kiro, Cursor & Codex". GitHub Topics should include `codex` tag. This list must stay in sync across README, CLI help, and GitHub repo metadata.

**Why:** v0.5.2 added Codex support to README/CLI but the GitHub About wasn't updated until now (v0.5.4+). Keeping metadata consistent prevents future support-list drift.

**How to apply:** When adding new agent support or updating the canonical list, update README → CLI → GitHub About/Topics in that order. Use this four-agent list as the source of truth.
