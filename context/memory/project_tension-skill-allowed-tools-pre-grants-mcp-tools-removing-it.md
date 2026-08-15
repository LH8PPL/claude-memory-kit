---
id: P-Z5NMSKZZ
type: project
title: 'TENSION: skill allowed-tools pre-grants MCP tools — removing it fixes skill prompt but un-fixes MCP tools'
created_at: 2026-06-27T17:20:04Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f7ac1044bc0816164e05685322be6143ae7b145e8525d9bb21786a52c8d96939
related: [correction-per-tool-mcp-first-use-prompt-within-one-turn-no, answered-mcp-per-tool-allow-does-not-persist-across-sessions, mcp-prompt-two-gate-model-gate-1-server-approval-is-the-unte]
---

KEY TENSION discovered (cut-gate-v041j vs v041g/h, CC 2.1.195, 2026-06-27): the skill's allowed-tools and the MCP per-tool prompt are in TENSION — removing allowed-tools fixes the skill prompt but UN-fixes the MCP tools. Evidence: v041g/v041h were FULLY prompt-free (mk_remember AND mk_search ran silently) — those folders had enableAllProjectMcpServers/enabledMcpjsonServers AND the skill STILL had its allowed-tools frontmatter. v041j REMOVED the skill's allowed-tools → skill prompt GONE (good) BUT now mk_remember prompted on first use, then mk_lessons_promote prompted on ITS first use (each distinct MCP tool prompts once per session, despite mcp__cmk__* + all 11 names + enabledMcpjsonServers:[cmk] all being in settings.json). MECHANISM: the skill's `allowed-tools: mcp__cmk__mk_remember mcp__cmk__mk_forget mcp__cmk__mk_trust ...` was PRE-GRANTING those MCP tools FOR THE DURATION OF THE SKILL — so when capture ran THROUGH the skill, the listed tools didn't prompt. That's why v041g/h were silent for mk_remember/mk_search. The settings.json mcp__cmk__* allow-list does NOT itself suppress the per-tool first-use prompt on 2.1.195 — the skill's allowed-tools grant was doing the real suppression. CONCLUSION/REFRAME: do NOT remove allowed-tools blindly. The skill prompt (from allowed-tools) and the MCP per-tool prompts are a PACKAGE: with allowed-tools, you get ONE skill-approval but then prompt-free MCP tools; without it, no skill prompt but per-tool MCP prompts. NEED: find a config that gives BOTH — skill silent AND MCP tools silent. Candidates to test: (a) keep allowed-tools but check if the ONE skill prompt is a one-time-per-project persist (does clicking allow on the skill ever stop re-prompting?); (b) whether enabledMcpjsonServers alone (no skill path) makes direct MCP calls silent given more server warmup; (c) alwaysLoad on .mcp.json. CC is 2.1.195 (latest); changelog has no entry for 'allow-listed MCP tool still prompts first-use'.

**Why:** v041g/h were fully prompt-free WITH the skill's allowed-tools, which was pre-granting the MCP tools during skill execution; removing allowed-tools (to fix the skill prompt) reintroduced per-tool MCP prompts. The two prompts are coupled, so the fix must address both together, not one at a time.

**How to apply:** Do not blindly remove allowed-tools. Find a config giving BOTH silent: test whether the single skill-approval persists per-project (one-time acceptable), and whether the settings.json mcp__cmk__* allow-list can be made to actually suppress per-tool prompts on 2.1.195 (or if only the skill grant does). Decide the kit's design from the result. CC version is 2.1.195.
