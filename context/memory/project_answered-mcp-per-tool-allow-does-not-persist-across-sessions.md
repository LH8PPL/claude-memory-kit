---
id: P-3URUGUAa
type: project
title: 'ANSWERED: MCP per-tool ''allow'' does NOT persist across sessions (dev repo: 0 stored approvals despite dozens of clicks)'
created_at: 2026-06-27T17:25:33Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 128c2a1562b4bbcc2c734cb47fd6891e493c866b364bf9e851f5d23475c4dc42
related: [tension-skill-allowed-tools-pre-grants-mcp-tools-removing-it, correction-per-tool-mcp-first-use-prompt-within-one-turn-no, skill-gate-clicking-allow-persists-nothing-workspace-trust-i]
---

ANSWERED — the MCP per-tool approval does NOT persist across sessions (CC 2.1.195, 2026-06-27, definitive disk proof). The user's key question: "does clicking allow persist to other sessions?" Answer: NO. Proof: the DEV repo (c:/Projects/claude-memory-kit) has had the mcp__cmk__ prompts clicked "allow (shared)" DOZENS of times across many sessions, yet on disk in ~/.claude.json it has allowedTools:0 entries (zero mcp__cmk__ approvals stored) AND enabledMcpjsonServers:[] (empty). v041j likewise got NO ~/.claude.json record after clicking allow. So "Yes, allow for this project (shared)" does NOT write a durable approval — every new session re-prompts for each MCP tool's first use. This is why the dev repo prompts every session despite endless clicking. IMPLICATION: the per-tool MCP prompt is a per-SESSION, non-persisting gate on 2.1.195 that the kit's settings.json allow-list does not suppress — clicking through it is NOT a one-time cost, it recurs every session. So the ONLY paths that are genuinely prompt-free across sessions are: (1) the automatic Stop-hook capture (in-process writeFact, no MCP — already prompt-free, persists by being hook-based), and (2) the SKILL's allowed-tools grant (suppresses the listed MCP tools during skill execution every session, no persistence needed because the grant is re-applied each time the skill runs). This argues FOR keeping the skill's allowed-tools (re-grants every session) rather than relying on settings.json MCP allow (which never suppresses) or per-session clicks (which never persist). But keeping allowed-tools reintroduces the ONE 'Use skill?' prompt per session — UNLESS that skill approval persists (untested: needs fresh-folder + allowed-tools-kept + new-session check).

**Why:** The user asked whether allow persists across sessions — the answer determines whether the prompt is a one-time cost or a recurring annoyance. Disk proof from the heavily-clicked dev repo shows zero persisted approvals, so it recurs every session; the settings allow-list does not suppress it, making the skill's per-run allowed-tools grant the most viable suppression for the agentic path.

**How to apply:** Conclude: don't rely on per-session clicks (never persist) or settings.json MCP allow (never suppresses on 2.1.195). The automatic Stop-hook path is already prompt-free. For the agentic path, the skill's allowed-tools grant re-suppresses every session — keep it. Then test whether the single 'Use skill?' approval persists across sessions; if it does, keeping allowed-tools = one click per project. Decide Task 172 from that.
