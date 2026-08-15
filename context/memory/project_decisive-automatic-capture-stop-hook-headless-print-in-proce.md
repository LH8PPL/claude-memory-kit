---
id: P-MY56XZZ2
type: project
title: 'DECISIVE: automatic capture (Stop hook → headless --print → in-process writeFact) is structurally prompt-free'
created_at: 2026-06-27T14:28:38Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 8881ed3e1eed58b044aa1ade141aa46c23bfe7fd53d0dc1d4fff458089340408
related: [skill-prompt-model-auto-invoke-confirmation-not-allow-list-g, complete-design-one-permissionrequest-hook-mcp-cmk-skill-mat, skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c]
---

DECISIVE (2026-06-27, code-proven): the kit's DEFAULT automatic capture path is STRUCTURALLY prompt-free — independent of the skill + MCP gates. Chain: Stop hook fires cmk-capture-turn (a pre-authorized background hook command — hooks never prompt) → spawns detached auto-extract (auto-extract.mjs) → which (a) spawns `claude --print --max-turns 1 --mcp-config '{"mcpServers":{}}' --strict-mcp-config` (compressor.mjs:217-228) = HEADLESS Haiku, non-interactive, NO tools/MCP/skills available, so nothing can prompt the user; and (b) writes via memoryWrite()/writeFact() imported as DIRECT in-process JS functions (auto-extract.mjs:53-54) — NOT the memory-write skill, NOT the mcp__cmk__ tools, NOT a user-facing claude session. So NO skill prompt, NO MCP prompt, ZERO interactive surface on the automatic path. CONCLUSION: the skill "Use skill?" prompt + the mcp__cmk__ prompt appear ONLY on the EXPLICIT in-conversation paths (when Claude chooses to invoke the memory-write skill or call mk_remember mid-chat). The kit's core promise ("automatic, prompt-free capture") rides the Stop-hook path and HOLDS regardless. The MCP fix (enabledMcpjsonServers:[cmk]) still matters for the explicit mk_remember path the model uses agentically; the skill prompt is CC's model-invoke confirmation with no documented suppression. Probe also found: plugin-scoped skills (.claude-plugin/plugin.json making <name>@skills-dir) STILL require workspace trust (skills doc line 123) — so plugin-packaging the skill would not avoid the gate either.

**Why:** This resolves whether the skill/MCP prompts threaten the kit's core promise: they do not. The default auto-extract path uses a background hook + a headless toolless claude --print + direct JS writes, none of which can show a user prompt. The prompts only affect the explicit/agentic paths.

**How to apply:** Frame the skill prompt honestly: it affects only the explicit mid-chat skill invocation, not the automatic capture the kit is built around. Ship the MCP fix (enabledMcpjsonServers:[cmk]) for the agentic mk_remember path. For the skill-invoke confirmation, accept it as CC behavior OR pursue plugin/managed-settings routes (note: plugin-scoped skills still need workspace trust). Re-frame Task 169 in DECISION-LOG as misdirected.
