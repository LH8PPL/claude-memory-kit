---
id: P-WJRUQVSW
type: project
title: Kiro IDE .kiro.hook on-disk format VERIFIED from a real hook created in the Kiro
created_at: 2026-06-20T21:04:22Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: fc86754117e4a1b9b9085586eda7bc43064a5950ef53e51c824ff770ebbed9a7
related: [kiro-ide-hooks-are-a-better-fit-for-the-kit-than-i-first-con, correction-to-d-182-2026-06-21-the-survey-s-claim-ide-kiro-h, decision-the-user-2026-06-21-rework-kiro-support-properly-be]
---

Kiro IDE .kiro.hook on-disk format VERIFIED from a real hook created in the Kiro IDE GUI (the user made one; docs deliberately omit this). File: <project>/.kiro/hooks/<name>.kiro.hook, JSON: {version:'1.0.0', enabled:true, name, description, when:{type:'agentStop'|'fileEdited'|...}, then:{type:'runCommand', command, timeout:60}}. So IDE hooks ARE file-installable (contradicts the docs' UI-only implication). The agentStop trigger + runCommand shell action = capture-at-turn-end running an arbitrary CLI. This is DIFFERENT from the CLI agent-config hook format ({hooks:{agentStop:[{command,timeout_ms}]}} inside .kiro/agents/<name>.json) — IDE uses when/then + 'timeout', CLI uses an event-keyed array + 'timeout_ms'. Two distinct real formats, both now verified.

**Why:** The docs refused to document the .kiro.hook format (UI-first). A real file from the user's Kiro install is the only primary source — and it reveals IDE hooks ARE installable from a file, which reopens the IDE-hooks path as a real option for the kit (automatic agentStop, no default-agent needed). The when/then structure differs from the CLI agent-config hook array.

**How to apply:** The kit's Kiro support can target EITHER: (IDE) write .kiro/hooks/cmk-capture.kiro.hook {when:{type:agentStop},then:{type:runCommand,command:'cmk capture',timeout:60}} — automatic, no default-agent — but IDE-only + needs an agentStart/prompt-submit equivalent for inject; OR (CLI) the agent-config + default-agent path. Live-verify which fires for the user's actual workflow. Field names exact: when.type, then.type=runCommand, command, timeout(seconds, not _ms).
