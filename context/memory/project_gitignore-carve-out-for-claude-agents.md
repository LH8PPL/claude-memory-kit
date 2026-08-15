---
id: P-2J4ZDGWK
type: project
shape: State
title: Gitignore Carve-out for `.claude/agents/`
created_at: 2026-07-22T16:04:40Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: df95b6bb0560c4d823a9b8dedd7f98c0bb62d7aeddd5f2417ce81fa4debe39e8
related: [claude-gitignore-strategy, agent-neutral-names-persist-across-any-rename, mcp-server-and-settings-file-organization]
---

The `.claude/` directory is gitignored (per-developer settings, scaffolding, skills), but `.claude/agents/` is explicitly re-included and committed to preserve agent definitions as project doctrine and version history.

**Why:** Agent definitions are durable, project-wide policy (not per-developer), so they belong in git. Settings and scaffolding remain ignored per original design.

**How to apply:** All agent definitions go in `.claude/agents/` (committed). Other `.claude/` contents stay ignored.
