---
id: P-La4E54JK
type: project
title: 'SKILL gate: docs say Skill(name *) space; kit writes Skill(name:*) colon — plus workspace-trust prereq'
created_at: 2026-06-27T14:11:17Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: a949483789e5a405692647853b3eeb035b3fa42410695e642d451f8b9c47d27d
related: [skill-gate-clicking-allow-persists-nothing-workspace-trust-i, skill-gate-is-likely-workspace-trust-one-time-not-rule-synta, root-cause-skill-md-allowed-tools-frontmatter-triggers-the-a]
---

SKILL-GATE finding (from code.claude.com/docs/en/skills, 2026-06-27): the "Use skill /memory-write?" prompt is a SECOND gate, separate from the MCP gate. Two relevant doc facts: (1) LINE 553: "Permission syntax: Skill(name) for exact match, Skill(name *) for prefix match with any arguments" — the prefix form uses a SPACE: Skill(name *), shown in examples Skill(review-pr *) / Skill(deploy *). The KIT WRITES THE COLON FORM Skill(memory-write:*) (settings-hooks.mjs:236-239) — colon is the Bash/PowerShell wildcard convention, NOT the documented Skill syntax. CAVEAT: the kit's own comment (settings-hooks.mjs:219-220, Task 169) says CC ITSELF wrote Skill(memory-write:*) when the user clicked allow — so there is CONFLICTING evidence (docs say space, observed CC-write was colon). (2) LINES 123 + 364: project .claude/skills/ "requires accepting the workspace trust dialog first" — allowed-tools/skill perms "take effect AFTER you accept the workspace trust dialog for that folder." So skills ALSO have a workspace-trust prerequisite, parallel to the MCP server gate. UNRESOLVED: whether the fix is (a) switch Skill(name:*) -> Skill(name *) space form, (b) the workspace-trust dialog not yet accepted in test folders, or (c) both. NEXT (systematic): on a fresh folder, let CC write the skill rule on "allow" and READ which form it writes THIS CC version (docs vs observed may have drifted), AND check whether workspace-trust was accepted. Do NOT guess — observe.

**Why:** The skill-use prompt is a distinct second gate from the MCP gate and still fires in every fresh folder. The skills doc documents a space-form prefix syntax that differs from the colon form the kit writes, AND a workspace-trust prerequisite — either or both could be the cause; it must be observed live, not guessed.

**How to apply:** Fresh folder: trigger the skill, click allow, read which Skill(...) form CC writes on THIS version (settings.json or settings.local.json), and confirm whether the workspace-trust dialog was accepted. Then decide: switch to space form, ensure trust acceptance, or both. Pair the skill-gate fix with the MCP-gate fix (enabledMcpjsonServers:[cmk]) in the same Task 172.
