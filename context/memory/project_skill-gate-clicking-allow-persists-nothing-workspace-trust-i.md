---
id: P-X6HLUKGM
type: project
title: 'SKILL gate: clicking allow persists nothing → workspace-trust is the suspect, not syntax'
created_at: 2026-06-27T14:22:20Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: c8140f81980882613d46bfcfca7b5f97ea7432c3727d56216f436a975bbaca89
related: [skill-gate-is-likely-workspace-trust-one-time-not-rule-synta, skill-gate-docs-say-skill-name-space-kit-writes-skill-name-c, answered-mcp-per-tool-allow-does-not-persist-across-sessions]
---

SKILL-GATE key asymmetry observed (cut-gate-v041i, 2026-06-27): clicking "allow (shared)" on the "Use skill /memory-write?" prompt persists NOTHING — no settings.local.json created, NO ~/.claude.json record for the folder, no new rule in settings.json. CONTRAST: clicking allow on the MCP-tool prompt earlier DID write a record (and enabledMcpjsonServers cleared it permanently). So the skill prompt re-fires every new session because the approval isn't being stored. The kit ALREADY has Skill(memory-write) exact + Skill(memory-write *) space + Skill(memory-write:*) colon in permissions.allow — ALL THREE — and it STILL prompts, which per the skills doc (line 364: "project .claude/skills/ skill perms take effect AFTER you accept the workspace trust dialog") points to WORKSPACE TRUST as the gate, NOT rule syntax. v041i has hasTrustDialogAccepted UNSET in ~/.claude.json. HYPOTHESIS (needs ONE observation, not a theory): inside the VS Code extension, CC may defer to VS Code's own workspace-trust, and the C:\Temp\cut-gate-* folders may be opening NOT-trusted, so no skill rule is ever active. Settings doc confirms NO documented setting to pre-trust / skip the trust dialog. OPEN QUESTION for the user: when opening these test folders, does a "Do you trust the authors of the files in this folder?" dialog appear (VS Code OR Claude Code), and is it being accepted? That single observation decides whether the skill gate is (a) untrusted-workspace (expected, one-time once trust works) or (b) something unsuppressable.

**Why:** The skill prompt re-fires every session because clicking allow stores no approval — distinct from the MCP gate which did persist. All three Skill rule forms are present and still prompt, which per the docs points to the workspace-trust prerequisite, not rule syntax. The trust state is the one unconfirmed variable.

**How to apply:** Confirm whether a workspace-trust dialog appears and is accepted when opening the test folders; check if CC defers to VS Code workspace trust in the extension. If trust is the gate and it's a one-time accept, document as expected; if trust can't be made to stick, escalate. Keep this with Task 172.
