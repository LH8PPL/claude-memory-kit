---
id: P-JJRQT9V7
type: project
title: 'CONFIRMED: enabledMcpjsonServers:["cmk"] narrow form = prompt-free + safer'
created_at: 2026-06-27T14:05:13Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 8b54b97362afb597172a392543f6cd1a4dd9b0f1a7abe6b312450b8f9b93adf4
related: [solved-enableallprojectmcpservers-true-prompt-free-mcp-captu, skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil]
---

CONFIRMED narrow form (cut-gate-v041h, 2026-06-27): enabledMcpjsonServers:["cmk"] in committed .claude/settings.json is ALSO prompt-free for MCP — and it's the SAFER choice (approves ONLY the cmk server, vs enableAllProjectMcpServers:true which blanket-approves every server in .mcp.json). Single-variable test: fresh install + ONLY enabledMcpjsonServers:["cmk"] (no enableAllProjectMcpServers, no settings.local.json) → CC showed "The cmk MCP server is now connected. Let me load the mk_remember schema" → mk_remember saved silently (id P-U6LH3RLL) with NO mcp__cmk__ prompt (user: "it didnt ask anything after the skill"). DECISION LOCKED: the kit Task-172 fix writes enabledMcpjsonServers:["cmk"] (narrow) NOT enableAllProjectMcpServers:true (broad) into the scaffolded settings.json — approves only our server, correct security posture for a kit shipped to others. REMAINING SEPARATE BUG: the Skill(memory-write) "Use skill /memory-write?" prompt STILL fires in every fresh folder despite Skill(memory-write)+Skill(memory-write:*) being in permissions.allow — this is a SECOND gate, distinct from the MCP gate, in the D-209/Task-169 area we thought settled. Investigate next.

**Why:** Both the broad (enableAllProjectMcpServers) and narrow (enabledMcpjsonServers:[cmk]) forms tested prompt-free; the narrow form is chosen because it approves only the kit's own server, the correct security posture for a tool shipped to others.

**How to apply:** Task 172: settings-hooks.mjs writeKitHooks writes enabledMcpjsonServers:["cmk"] into committed .claude/settings.json idempotently at install + repair --hooks, with a test. Separately investigate the still-firing Skill(memory-write) prompt (second gate, D-209 area).
