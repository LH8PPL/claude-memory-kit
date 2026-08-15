---
id: P-9DYNAHaZ
type: project
title: Kiro-CLI Agent Configuration and Verification
created_at: 2026-06-24T07:09:51Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8f49652051ab56f9e06c066b2f9c912dff26be6e50e299a53832ae80ece91090
related: [d-198-fix-agentspawn-hook-now-fires, kiro-cli-agent-config-reads-from-kiro-agents-not-aws-amazonq, kiro-cli-agent-resolution-requires-global-default]
---

- Agent configuration path: `~/.kiro/agents/cmk.json`
- When properly loaded, default agent resolves to `cmk` (not `kiro_default`)
- D-198 fix involved ensuring this file is loaded and hooks execute correctly
- Verification method: probe logs from `agentSpawn` and `preToolUse` hooks confirm loading and hook execution

**Why:** Configuration location and verification approach are essential for kiro-cli agent setup debugging and fix validation

**How to apply:** When troubleshooting kiro-cli agent resolution, check `~/.kiro/agents/cmk.json` and use hook probe logs to verify the fix
