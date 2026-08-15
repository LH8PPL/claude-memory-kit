---
id: P-LRRM4RPF
type: project
title: SKILL prompt = model-auto-invoke confirmation, not allow-list-governed; auto-extract hook path is already prompt-free
created_at: 2026-06-27T14:26:38Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: cf0118003c8995d324b0d0fa8beea3136865b1411926d8a12bfcc344ab0e2ddf
related: [decisive-automatic-capture-stop-hook-headless-print-in-proce, skill-gate-clicking-allow-persists-nothing-workspace-trust-i, correction-per-tool-mcp-first-use-prompt-within-one-turn-no]
---

SKILL-GATE conclusion (2026-06-27, observed+doc-grounded): the "Use skill /memory-write?" prompt is the model-auto-invoke CONFIRMATION layer, NOT governed by permissions.allow — proven because all 3 Skill rule forms (exact Skill(memory-write), space Skill(memory-write *), colon Skill(memory-write:*)) are present and CC STILL prompts, AND clicking "allow shared" writes NOTHING to any file (vs the MCP/Bash prompts which DO persist a rule on allow). No documented setting suppresses this confirmation (disable-model-invocation does the opposite — forces manual /skill only). KEY REFRAME: the kit has TWO capture paths. (1) AUTO-EXTRACT (the DEFAULT promise): Stop hook -> cmk-capture-turn -> cmk CLI directly. Hooks are pre-authorized background commands and NEVER prompt — so the automatic path IS prompt-free already. (2) memory-write SKILL: only fires when Claude CHOOSES to invoke it mid-conversation (the override path) — THIS is what shows the "Use skill?" confirmation. So the skill prompt affects only the explicit-skill path, not the core automatic Stop-hook path. IMPLICATION: Task 169's premise (allow-list Skill forms to suppress the prompt) was misdirected — the prompt isn't allow-list-governed. The MCP gate fix (enabledMcpjsonServers:[cmk]) IS real + needed for the mk_remember MCP path. OPEN DECISION for the user: is the skill-invoke confirmation acceptable (it's CC's design for model-invoked skills; the automatic hook path is unaffected), or do we need the skill path prompt-free too (would require a CC-supported mechanism we haven't found)?

**Why:** After ruling out every Skill rule form and confirming clicking allow persists nothing, the skill prompt is the model-invoke confirmation layer, outside permissions.allow. The kit's core automatic capture rides the Stop hook (prompt-free); only the explicit skill path shows this confirmation — which reframes whether it's even a blocker.

**How to apply:** Decide with the user: accept the skill-invoke confirmation (auto-extract hook path is already prompt-free, so the core promise holds) OR keep hunting a CC mechanism to suppress model-invoke confirmations. The MCP fix (enabledMcpjsonServers:[cmk]) ships in Task 172 regardless. Revisit Task 169 framing in DECISION-LOG.
