---
id: P-F4WFAXAQ
type: project
title: 'Decision (the user, 2026-06-21): the Kiro rework wires BOTH IDE + CLI hook surfa'
created_at: 2026-06-20T22:08:04Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: f49d55ef5a2a9eb71262bbefb59ebd57ec58b40c5bb3c86d94b255aa17452f38
related: [decision-the-user-2026-06-21-the-kit-s-kiro-support-wires-al, plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes, correction-to-d-182-2026-06-21-the-survey-s-claim-ide-kiro-h]
---

Decision (the user, 2026-06-21): the Kiro rework wires BOTH IDE + CLI hook surfaces for v0.4.0 — full coverage for every Kiro user, not IDE-first-CLI-later. Combined with the 3 shared surfaces (MCP/steering/skills install once for both), the complete Kiro install is: SHARED — (1) MCP .kiro/settings/mcp.json, (2) steering .kiro/steering/cmk.md inclusion:always, (3) skills memory-search+memory-write SKILL.md → .kiro/skills/; IDE HOOKS — .kiro/hooks/cmk-inject.kiro.hook (promptSubmit→runCommand) + cmk-capture.kiro.hook (agentStop→runCommand), automatic no-default-agent; CLI HOOKS — agent-config hooks{agentSpawn,stop} + guarded default-agent (q_cli_default or chat.defaultAgent, non-clobber). One shared 'cmk hook <event>' dispatcher serves all. 8-point live-test on BOTH a real Kiro IDE session AND kiro-cli before claiming automatic for either.

**Why:** The user chose complete coverage over phased. Kiro IDE is the primary surface (their main work IDE) + CLI for terminal users. Both hook surfaces support deterministic capture (the runCommand correction). Consistent with the all-4-surfaces + rework-properly decisions — architecture-first completeness (U-VMASJQ55).

**How to apply:** Build order: (1) shared 3 surfaces via the existing installAgent/marker-block + a skills-copy step; (2) the cmk hook <event> dispatcher (shared w/ Claude Code's cmk-inject-context/cmk-capture-turn — reuse those, route by event); (3) IDE .kiro.hook writer (format P-WJRUQVSW); (4) CLI agent-config writer + guarded default-agent (D-182 Rust contract); (5) live-test both surfaces. Replaces the #210 Kiro profile's wrong hook/steering approach. New PR off main.
