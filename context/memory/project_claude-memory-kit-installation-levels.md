---
id: P-9VESM93S
type: project
title: Claude Memory Kit Installation Levels
created_at: 2026-06-14T10:06:37Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 3b2c7ab7de2d29a8d9927ad618a305834a3aa333b583d73a3c9b25de50bfe74d
related: [gate-testing-isolated-throwaway-folders, clean-start-procedure-for-session-1-test, kiro-ide-hook-testing-multi-step-gate-sequence]
---

The kit has two distinct installation scopes:
- **Global CLI** (`npm install -g ./lh8ppl-claude-memory-kit-0.3.1.tgz`): machine-wide, one-time. Provides the `cmk` binary.
- **Per-project scaffold** (`cmk install --with-semantic`): per-folder, required for each new project. Scaffolds `context/` and wires hooks.

Reusing a project folder from a previous session (e.g., `cut-gate10` after Session 0 probe runs) contaminates it with old facts, breaking B3/B4 validation tests that need auto-capture-from-zero.

**Why:** Testing Session 1 validates that cross-project persona capture fires correctly; this requires a fresh project folder with zero pre-seeded facts. The global binary is stable; only the per-project scaffold is session-specific.

**How to apply:** For each test session, create a fresh project folder, run `cmk install --with-semantic` in it (do not reuse previous session folders), and ensure B3/B4 checks see genuinely auto-captured facts, not legacy state.
