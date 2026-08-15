---
id: P-ZFY7KYAW
type: project
title: Skill fix works (allowed-tools removed); now MCP cold-start race on first call
created_at: 2026-06-27T17:17:51Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 79be40db965343f20d3374ab39d2aea9ad78736d0eaacdc64a8d73e5e9dc72f3
related: [tension-skill-allowed-tools-pre-grants-mcp-tools-removing-it, root-cause-skill-md-allowed-tools-frontmatter-triggers-the-a, skill-gate-clicking-allow-persists-nothing-workspace-trust-i]
---

SKILL FIX CONFIRMED + new MCP cold-start race observed (cut-gate-v041j, 2026-06-27): removing allowed-tools from SKILL.md WORKED — the "Use skill /memory-write?" prompt did NOT appear (changelog-3140 root cause confirmed: skills without additional permissions run prompt-free). BUT a different prompt appeared: mcp__cmk__mk_remember, with the on-screen message "The cmk MCP server isn't connected yet. Let me use the CLI fallback... The cmk MCP server is now connected." enabledMcpjsonServers:["cmk"] IS present in v041j settings.json. State check: NONE of the folders (v041g/h/i prompt-free ones included) got a ~/.claude.json project record — so that's not the differentiator. HYPOTHESIS: a COLD-START RACE — the cmk stdio MCP server (cmk mcp serve subprocess) takes a beat to connect; on a brand-new session, the FIRST mk_remember call can fire BEFORE the server finishes connecting, so CC can't confirm the tool against the not-yet-connected server and prompts. In v041g/v041h the call went THROUGH the skill (which had allowed-tools granting the tool) so it didn't hit this; now that allowed-tools is removed, Claude calls mk_remember directly and races the server cold-start. TEST: click allow, then state a SECOND preference — if the second is prompt-free (server now warm), the race is confirmed. POSSIBLE FIX DIRECTION: alwaysLoad:true on the .mcp.json server (docs: "blocks startup until the server connects, capped at 5s" — forces the server present before the first prompt is built), OR keep a minimal allowed-tools on the skill (but that reintroduces the skill prompt). Needs the two-step observation first.

**Why:** Removing allowed-tools fixed the skill prompt but surfaced an MCP cold-start race: the on-screen 'server isn't connected yet' message indicates the first mk_remember call beats the stdio server's connection on a fresh session, despite enabledMcpjsonServers being set.

**How to apply:** Confirm the race with a two-step test (second preference should be prompt-free once the server is warm). If confirmed, evaluate alwaysLoad:true on .mcp.json (docs: blocks startup until server connects, ≤5s) as the fix so the server is present before the first tool call. Bundle into Task 172.
