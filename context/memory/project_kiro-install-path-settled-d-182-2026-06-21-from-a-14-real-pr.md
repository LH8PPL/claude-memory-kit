---
id: P-P9FL3NYB
type: project
title: Kiro install path SETTLED (D-182, 2026-06-21, from a 14-real-project survey + th
created_at: 2026-06-20T21:21:48Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f83b82958ce123f8fe6cf5a2d181ac2466e345a3e77c4cad1ea08a74655ffad5
related: [decision-the-user-2026-06-21-the-kiro-rework-wires-both-ide, decision-the-user-2026-06-21-the-kit-s-kiro-support-wires-al, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes]
---

Kiro install path SETTLED (D-182, 2026-06-21, from a 14-real-project survey + the AUTHORITATIVE Amazon-Q Rust hook contract — Kiro CLI IS Amazon Q Developer CLI). FOUR decisions: (1) CLI agent-config with a hooks{} block is the dominant real pattern (9/14 repos, 3/4 memory projects) + the capture SPINE — NOT IDE .kiro.hook. (2) IDE .kiro.hook is DISQUALIFIED for capture: ZERO surveyed repos use runCommand for lifecycle capture — all use then:askAgent (LLM-prompt, non-deterministic) + it's IDE-surface-only (doesn't fire for kiro-cli). IDE hook = optional user-triggered convenience only. (3) Set chat.defaultAgent (or the q_cli_default named-file override) to get automatic activation with NO --agent flag — 5/14 repos did this; GUARD against clobbering a user's existing default (merge or cmk-doctor notice). (4) inject=agentSpawn (runs once, cached whole-conversation = SessionStart analog), capture=stop (session-end), both deterministic runCommand→one 'cmk hook <event>' dispatcher (usalu/semio pattern). AUTHORITATIVE SCHEMA: target the Rust contract NOT the stale agent-v1.json — 5 triggers (agentSpawn/userPromptSubmit/preToolUse/postToolUse/stop), Hook fields {command(req), timeout_ms(u64 default 30000), max_output_size(default 10240), cache_ttl_seconds(default 0), matcher(preToolUse/postToolUse only)}, camelCase keys. Agent-config also carries mcpServers + resources + prompt(file://AGENTS.md). Config dir: .amazonq/cli-agents/ (local) + ~/.aws/amazonq/cli-agents/ (global).

**Why:** The user's push to check 15+ real projects + clone them settled the install path with EVIDENCE (a tally) not theory, and surfaced the authoritative source (Amazon-Q Rust) that corrects the stale published JSON schema. CLI-agent-config wins because IDE hooks can't do deterministic capture (askAgent only) — the kit's whole thesis is deterministic auto-capture.

**How to apply:** Build the Kiro installer to write a CLI agent-config (q_cli_default.json or cmk.json+activation, guarded non-clobber) with hooks{agentSpawn→cmk hook agentSpawn, stop→cmk hook stop} + mcpServers.cmk + resources[AGENTS.md, steering] + prompt:file://AGENTS.md. ALSO wire skills (memory-search/memory-write SKILL.md → .kiro/skills/) + steering(.kiro/steering/cmk.md) + MCP(mcp.json) per the all-4-surfaces decision. Target the Rust contract. Live-test the 8-point checklist (default resolves w/o --agent, inject+capture FIRE not just register) before claiming automatic.
