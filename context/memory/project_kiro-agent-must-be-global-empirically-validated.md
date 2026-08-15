---
id: P-67AA3MCQ
type: project
shape: State
title: Kiro Agent Must Be Global (Empirically Validated)
created_at: 2026-07-06T16:55:02Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7a832b5dad336cf4f946c51b9f45bc41de483a6ccd184db9e6b926e1c667e033
related: [kiro-cli-agent-resolution-requires-global-default, project-local-agent-auto-activation-design-bottleneck-for-ki, kiro-cli-vs-kit-activation-pattern-design]
---

The design question "Can Kiro support project-local agents?" was resolved: **No**.

Findings from 10-case test matrix (D-284, D-283):
- Project-local `.kiro/agents/` files don't auto-activate; kiro-cli uses built-in default
- Automatic memory requires global `chat.defaultAgent: cmk` setting
- Current global-only design is correct and vindicated

**Why:** Permanently settles whether Kiro can match Claude Code's project-local model. Empirical evidence prevents future re-litigation of this design choice.

**How to apply:** Configure Kiro agents only via global `chat.defaultAgent`. Do not attempt project-local placement as a shortcut.
