---
id: P-WZMQDPUU
type: project
title: D-198 Fix — agentSpawn Hook Now Fires
created_at: 2026-06-24T07:11:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d91b4624026524947bce319cec0c2a1aee16ddc0cc006f825243d4caef1258ba
related: [kiro-cli-agent-configuration-and-verification, hook-payload-delivery-stdin-not-environment, kiro-cli-agent-config-reads-from-kiro-agents-not-aws-amazonq]
---

- **Pre-D-198:** Config in dead `~/.aws` location → no hooks fired
- **Post-D-198:** Config moved to `~/.kiro/agents/cmk.json` with `chat.defaultAgent: cmk`
- **Verification:** agentSpawn hook fires with payload on stdin; probe log shows `hook_event_name`, `cwd`, `session_id`
- **Version:** Kiro 2.9.0

**Why:** Confirms the fix resolved the "agent cmk not found" issue; agent resolution now works correctly

**How to apply:** Check `~/.kiro/agents/cmk.json` for agent config; payloads arrive on stdin as JSON (not env vars)
