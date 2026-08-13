---
id: P-EGNWHD5T
type: feedback
title: consult the user before shipping a fix mid-live-diagnosis
created_at: 2026-06-27T07:10:36Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 18d3113b81a83481e815431c2f21ea3487a754757c3afa25c0fe35dc6acbec66
related: [session-checkpoint-v0-4-1-cut-gate-3-fixes-merged-awaiting-c, cli-route-fix-prompt-vs-skill-conflict-ide-cli-share-skill, tension-skill-allowed-tools-pre-grants-mcp-tools-removing-it]
---

During a live debugging/gate session, do NOT implement + ship a fix without consulting the user first — especially when (a) the root cause is still being verified live, or (b) an external change (e.g. a pending Claude Code update) might resolve it at the source, making the fix unnecessary. The user (2026-06-27): "you are making the fix already without me saying anything without consulting me, there is another update, maybe it fixes it all and we don't even need to do whatever you decided to do." Consult before coding a fix mid-diagnosis.

**Why:** In the v0.4.1 gate I diagnosed the MCP-wildcard issue and immediately built+merged Task 171 — but the user was about to update Claude Code, which might fix the prompt at the source and make the fix moot. Shipping pre-emptively wastes effort and removes the user's decision. The autopilot 'fix everything now' directive does NOT apply during an interactive live-diagnosis where an external fix may land.

**How to apply:** When debugging live (gate/cut-gate/diagnosis): present the diagnosis + the proposed fix, then ASK before implementing — particularly if an upstream update, a config change, or the user's own next action could resolve it. Implement only after the user confirms the fix is the path. This is distinct from autopilot-on-tasks (where 'fix everything now' holds); a live shared-screen diagnosis is collaborative, not autonomous.
