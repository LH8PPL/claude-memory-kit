---
id: P-WG6SMMV7
type: project
title: 'CORRECTION to D-182 (2026-06-21): the survey''s claim ''IDE .kiro.hook is disquali'
created_at: 2026-06-20T22:03:51Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 8df0b77a103025d7aedb4e34705fdc0b613dc774e6df2c9c25395403891cd7b5
related: [kiro-ide-kiro-hook-on-disk-format-verified-from-a-real-hook, decision-the-user-2026-06-21-the-kiro-rework-wires-both-ide, kiro-ide-hooks-are-a-better-fit-for-the-kit-than-i-first-con]
---

CORRECTION to D-182 (2026-06-21): the survey's claim 'IDE .kiro.hook is disqualified for capture because it's askAgent-only' is WRONG — it conflated OBSERVED USAGE with CAPABILITY. PROOF: the user's own Kiro-IDE-UI-generated hook uses when.type=agentStop + then.type=runCommand (deterministic shell command on turn-end) — the IDE GUI itself emitted runCommand. So IDE hooks CAN do deterministic capture (runCommand adds stdout to agent context). The survey repos (Taskmaster 7x askAgent) CHOSE askAgent because their hooks are LLM-task-tracking, not because runCommand is unavailable. THEREFORE: the Kiro IDE is a FIRST-CLASS capture target, not 'optional convenience'. Both surfaces work for deterministic capture: IDE via .kiro/hooks/cmk-capture.kiro.hook {when:agentStop, then:runCommand:'cmk hook stop'} (automatic, NO default-agent needed) + CLI via agent-config hooks{stop} (needs default-agent). The IDE path is actually SIMPLER for IDE users (no default-agent clobber risk). Kiro was chosen as v0.4 target BECAUSE it's the user's main work IDE (P-DGN6ZNXZ) — the IDE is the PRIMARY surface, not the CLI.

**Why:** I let the research collapse to CLI-only and disqualified the IDE on a false premise (askAgent-only). The user caught it: 'why are you only talking about kiro cli and not kiro ide?'. Most Kiro users use the IDE; it was the original v0.4 target. The user's real hook proves IDE runCommand works. 3 of 4 surfaces (MCP/steering/skills) are SHARED IDE+CLI anyway; only hooks differ, and BOTH support deterministic capture.

**How to apply:** Rework the Kiro support to target BOTH surfaces: shared legs (MCP .kiro/settings/mcp.json + steering .kiro/steering/ + skills .kiro/skills/) install once for both. Hooks: write IDE .kiro/hooks/*.kiro.hook (when:agentStop/promptSubmit→then:runCommand:'cmk hook <event>', timeout:60) for the IDE AND the CLI agent-config hooks{} (+guarded default-agent) for kiro-cli. The IDE hook format is verified from the user's real file: {version,enabled,name,description,when:{type},then:{type:runCommand,command,timeout}}. Live-test BOTH: IDE hook fires agentStop in a real Kiro IDE session; CLI hook fires via default-agent. Do NOT claim either automatic until its surface is live-verified.
