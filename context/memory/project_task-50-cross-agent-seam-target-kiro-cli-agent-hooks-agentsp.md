---
id: P-AGV23NTY
type: project
title: 'Task 50 cross-agent seam: target Kiro CLI agent-hooks (agentSpawn=SessionStart-i'
created_at: 2026-06-20T14:27:43Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 143742e77924a6041d9b46ab80b8b4ad5cfda1644396947636c16b4bcf0d0c3a
related: [kiro-cli-hooks-gap-d-181-follow-up-found-by-reading-kiro-dev, kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook, kiro-ide-hooks-are-a-better-fit-for-the-kit-than-i-first-con]
---

Task 50 cross-agent seam: target Kiro CLI agent-hooks (agentSpawn=SessionStart-inject, stop=turn-end-capture) defined in .kiro/agents/<name>.json, NOT the IDE Agent-Hooks surface (file-event-centric, no session-start trigger). The Taskmaster .kiro/hooks/*.kiro.hook claim was the wrong hook system. Verified against kiro.dev primary docs.

**Why:** The kit's whole inject-at-start/capture-at-turn-end model only ports to the CLI agent-hook surface; building against the IDE surface would mean no session-start trigger + an undocumented on-disk format.

**How to apply:** When building the Kiro profile, set eventMap {sessionStart:'agentSpawn', turnEnd:'stop'} and write hooks into .kiro/agents/<name>.json; MCP → .kiro/settings/mcp.json (mcpServers); steering → .kiro/steering/ (inclusion: always).
