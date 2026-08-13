---
id: P-7J94CRGR
type: project
title: Capture Source — Agent Task-State via PostToolUse Hook
created_at: 2026-06-29T12:54:28Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: b3b4facaa1754285e80f676cc9f60f66a747be1157f3a7773ec344c919833f45
related: [now-md-assistant-cap-precedent, system-written-grants-file-as-specification, kiro-agent-must-be-global-empirically-validated]
---

nt (MIT, Go) auto-mirrors Claude Code's TodoWrite task-list into durable storage via a PostToolUse hook (idempotent, tagged `src:claude`).

This captures agent task state — a surface we don't currently extract: the agent's own live task list/progress, independent of conversation turns.

**Why:** Reveals an underexplored capture channel. Task state is metadata-rich and orthogonal to user messaging; complements conversation-turn extraction.

**How to apply:** Evaluate whether auto-capturing agent task lists (TodoWrite or equivalent) would improve memory fidelity when agents run between user interactions.
