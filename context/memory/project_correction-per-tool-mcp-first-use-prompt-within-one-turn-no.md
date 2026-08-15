---
id: P-ZBS4a23S
type: project
title: 'CORRECTION: per-tool MCP first-use prompt within one turn (no 2nd message); only skill allowed-tools suppresses it'
created_at: 2026-06-27T17:20:31Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: c45481f2ca35ce1bbe47ded9e029b76da57a204eed09d62ed05a3c9cfcca53b4
related: [tension-skill-allowed-tools-pre-grants-mcp-tools-removing-it, answered-mcp-per-tool-allow-does-not-persist-across-sessions, solved-enableallprojectmcpservers-true-prompt-free-mcp-captu]
---

CORRECTION + precise model (cut-gate-v041j, CC 2.1.195, 2026-06-27): the user did NOT send a second preference — from the SINGLE "mypy" prompt, Claude autonomously chained MULTIPLE MCP tools in ONE turn: mk_remember (saved mypy, silent — was allowed last turn) THEN mk_lessons_promote (to promote cross-project — PROMPTED, first use). So it is NOT a second-message race and NOT a cold-start race; it is per-distinct-MCP-tool first-use prompting within a single turn. RECONCILES with v041g/h: those were silent because the skill's allowed-tools listed exactly mk_remember/mk_search (the tools used there) and pre-granted them DURING the skill; mk_lessons_promote was never in any skill's allowed-tools (the write skill lists remember/forget/trust only), so it would have prompted there too — we just never triggered it. CONFIRMED PRECISE MODEL on 2.1.195: (1) settings.json permissions.allow mcp__cmk__* + specific names do NOT suppress the per-tool first-use prompt (Task 171 genuinely ineffective for this). (2) The ONLY thing that suppressed MCP tools was the SKILL's allowed-tools grant, and only for the tools it lists, only while the skill runs. (3) enabledMcpjsonServers:[cmk] clears the SERVER approval gate (server connects) but NOT the per-tool prompt. (4) Removing allowed-tools fixes the SKILL prompt but exposes every MCP tool to per-tool prompting. SUPERSEDES the cold-start-race hypothesis in P-ZFY7KYAW. Open question stands: is there ANY config that makes settings.json-level MCP allow actually suppress per-tool prompts on 2.1.195, or is the per-tool prompt only avoidable by (a) the skill allowed-tools grant or (b) not calling MCP tools agentically at all (the Stop-hook path, which is already prompt-free)?

**Why:** My prior note implied a second user message and a cold-start race; the user clarified no second preference was given — Claude chained mk_remember then mk_lessons_promote autonomously, and each distinct MCP tool prompts on first use. The settings.json allow-list does not suppress these; only the skill's allowed-tools grant did, for the tools it lists.

**How to apply:** Treat the per-tool MCP prompt as a 2.1.195 reality not cleared by permissions.allow. The kit's automatic Stop-hook path is unaffected (in-process writeFact, no MCP). For the agentic path, decide: rely on the skill's allowed-tools (one skill prompt, then listed tools silent) vs accept per-tool prompts vs find a settings mechanism. Verify whether the single skill-approval persists per-project before concluding.
