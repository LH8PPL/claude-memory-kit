---
id: P-RVCKGMZV
type: project
title: Hook Payload Delivery — stdin, Not Environment
created_at: 2026-06-24T07:11:24Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 00d099b49a5446dbd8eaec22d9bac277ea4d35b33acd0c37cd7e1aab1938005c
related: [d-198-fix-agentspawn-hook-now-fires, kiro-cli-agent-configuration-and-verification]
---

Kiro hook payloads arrive on stdin as JSON, not `_HOOK_EVENT` environment variable. Payload includes `hook_event_name`, `cwd`, `session_id`. Original bin design (reading stdin) was correct.

**Why:** Clarifies payload delivery mechanism; guides how to capture/parse hooks in probes or guards

**How to apply:** When capturing hooks in probes/guards, read stdin for JSON. Use probe logs (`kg-probe.log`) to verify hook firing.
