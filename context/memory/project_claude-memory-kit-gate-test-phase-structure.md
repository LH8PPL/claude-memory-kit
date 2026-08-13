---
id: P-29U75JGA
type: project
shape: Timeless
title: Claude-Memory-Kit Gate Test Phase Structure
created_at: 2026-07-06T12:24:51Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: cb61c1af816fc1d4241a3a18b471bf694cd5a41c1060814d79f835c15e857cc1
related: [cmk-gate-test-is-structured-in-phases-0-ryb7vedm, release-gate-cut-gate-guide-must-pass-before-tagging, v0-4-3-cut-gate-multi-phase-validation-structure]
---

The cmk gate test verifies the kit through structured phases:
- **§0**: Release cut + tarball (pre-Session 1)
- **§1**: Install + doctor + file checks; gates G0–G7 (version, install, leaks, hooks, MCP, semantic) + BK1–BK4 (backend CLI, split-brain, live spawn)
- **§2**: Session 1 — live agent build in C:\Temp\cut-gate20; watches hooks fire + memory capture
- **§5**: Session 2 — recall in fresh session
- **§6**: Cold-open wedge — isolated test in C:\Temp\cut-gate-coldopen20

**Why:** Understanding the phase structure helps future sessions know what's been tested and at which stage; §0–§1 is pre-Session 1 (systematic verification), §2+ are live-agent (interactive).

**How to apply:** When working on cmk gate coverage, consult this structure to identify phase boundaries and gate assignments. Use it to understand which phases have completed and which remain.
