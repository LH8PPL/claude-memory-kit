---
id: P-QMMLa7HT
type: project
shape: Event
title: B3/B4 Wedge Test Workflow — Cross-Project Doctrine Capture Validation
created_at: 2026-07-03T11:16:11Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0240334218a832138669fd9bff3697133098cd65bda67885c0f3f712d49f0c80
related: [re-pack-verify-workflow-for-cut-gate-testing, memory-persistence-validation-workflow-end-to-end, diagnostic-test-allow-list-vs-workspace-trust]
---

Workflow to validate cross-project rules are correctly captured and routed:
  1. Start a new Claude Code session on test directory (e.g., `C:\Temp\cut-gate-v044`)
  2. State the cross-project rule explicitly in a normal turn (e.g., "From now on, in every project I work on, always use `uv` for packages, never `pip`, and always run `ruff` before committing.")
  3. Wait ~30s for auto-extract to complete (detached subprocess)
  4. Verify rule appears in `HABITS.md` or `LESSONS.md` with `trust: high` + `write: user-explicit`, and `~/.claude-memory-kit/` directory is created

**Why:** Validates that explicitly-stated cross-project rules are correctly extracted, routed to harness memory, and tagged with high confidence

**How to apply:** Run this workflow after D-263 fix is deployed; close B3/B4 gates once verified
