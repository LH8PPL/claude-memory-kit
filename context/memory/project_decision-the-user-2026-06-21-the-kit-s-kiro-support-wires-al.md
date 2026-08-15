---
id: P-YKG4GF25
type: project
title: 'Decision (the user, 2026-06-21): the kit''s Kiro support wires ALL FOUR surfaces '
created_at: 2026-06-20T21:16:20Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 789a07050a7a0491f7ddfcb8447beefdab7adbed82978463ab9e09128b3c60f5
related: [decision-the-user-2026-06-21-the-kiro-rework-wires-both-ide, kiro-has-four-install-surfaces-not-three-the-user-s-correcti, kiro-install-path-settled-d-182-2026-06-21-from-a-14-real-pr]
---

Decision (the user, 2026-06-21): the kit's Kiro support wires ALL FOUR surfaces — hooks + steering + skills + MCP — NOT a subset. Hooks included specifically for DETERMINISTIC auto-capture (agentStop→runCommand: cmk capture), matching the kit's Claude-Code Stop-hook model (capture is deterministic, not dependent on the model choosing to call a tool). This is the thorough/complete choice; it accepts the install complexity of settling the IDE-.kiro.hook format + the CLI default-agent question (both being settled by the 15-project survey). Surface→job mapping: RECALL via steering(always-loaded)+skills(memory-search)+MCP(cmk tools); CAPTURE via hooks(deterministic agentStop→cmk capture)+skills(memory-write)+MCP.

**Why:** The kit's thesis is automatic, deterministic memory (D-85/D-164). A skills/steering-only recall+capture would be model-compliance-dependent (the model has to choose to call memory-write). Hooks give the same deterministic capture-at-turn-end the kit relies on for Claude Code. The user chose completeness over install-simplicity — consistent with the kit's architecture-first values (U-VMASJQ55: accept upfront cost to avoid future friction).

**How to apply:** Build the Kiro installer to wire 4 legs: (1) hooks — .kiro/hooks/*.kiro.hook (IDE, agentStop→runCommand) AND/OR CLI agent-config + default-agent (survey settles which); (2) steering — .kiro/steering/*.md inclusion:always + agent resources re-add; (3) skills — copy memory-search+memory-write SKILL.md to .kiro/skills/; (4) MCP — .kiro/settings/mcp.json. Live-test all 4 fire automatically on real kiro before claiming automatic.
