---
id: P-7N5XaF22
type: project
shape: State
title: Claude-memory-kit supports 3 IDE/tool agents
created_at: 2026-07-06T11:00:34Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 20f0124bb88d0bfa996df4e989905b55e395b829d6846f09146cfaffd999cf28
related: [cut-gate-release-validation-guides-per-agent, documentation-structure-and-prerequisite-locations, gate-guides-as-standalone-documentation-siblings]
---

- Claude Code (web / Claude IDE)
- Kiro (terminal CLI)
- Cursor (Cursor IDE)

Each agent requires its own cut-gate release validation guide, surface documentation (docs/), and prerequisite notes in README/quickstart.

**Why:** The kit must provide agent-specific installation, usage, and release validation steps for each of its three agents.

**How to apply:** When creating docs/guides, produce one per agent (Claude, Kiro, Cursor), each with agent-specific commands, file paths, and validation checks.
