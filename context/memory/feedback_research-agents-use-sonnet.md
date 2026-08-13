---
id: P-LQYRCH72
type: feedback
shape: Preference
title: research-agents-use-sonnet
created_at: 2026-07-07T19:45:27Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: 07d7ab3f65b6c715cd47cf5ea880e1273e37f18963cb15ee362738b5008bbc4b
related: [use-mcp-mk-remember-not-bash-cli, cmk-hook-capture-fails-during-stress-gate, core-memory-kit-stores-all-state-as-on-disk-markdown]
---

Subagent/research fan-outs should run on SONNET, not the session's main model — the user's explicit call (2026-07-07): "if you are going to use agents for the research, use sonnet."

**Why:** Research/survey agent work (cloning repos, reading code, web surveys) doesn't need the top-tier model; the user wants the cheaper/faster tier for fan-out work.

**How to apply:** When spawning Agent-tool subagents for research, surveys, code-reading, or other fan-out tasks, pass model: 'sonnet' explicitly. Applies to Workflow agent() calls too (opts.model). The main conversation stays on the session model.
