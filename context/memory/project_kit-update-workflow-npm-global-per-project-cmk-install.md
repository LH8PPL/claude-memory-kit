---
id: P-7CWH42PT
type: project
shape: State
title: Kit update workflow (npm global + per-project cmk install)
created_at: 2026-07-15T14:08:55Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 0ee89a052cf7139f3ba5627b4cd7d0d35d8b626c6f8822b508e248f6e605c843
related: [version-stamping-and-scaffold-isolation, updating-cmk-requires-re-running-bootstrap-on-project-files, npm-pack-global-install-for-artifact-testing-0b]
---

Updating the kit to a new version is a TWO-STEP process: (1) update the global binary: 'npm install -g @lh8ppl/core-memory-kit@latest'; (2) per-project refresh: 'cd <project> && cmk install' (idempotent — re-stamps the version-marked block in CLAUDE.md + re-wires hooks). Then RESTART Claude Code to load the new hooks/MCP server. Updating npm alone does NOT update project scaffolds — 'cmk doctor' HC-9 flags the drift if you skip step 2.

**Why:** The two-step is non-obvious and required; the package renamed to @lh8ppl/core-memory-kit in v0.5.4 so the old npm command is wrong

**How to apply:** npm install -g @lh8ppl/core-memory-kit@latest, then cmk install in each project, then restart Claude Code; cmk doctor HC-9 confirms
