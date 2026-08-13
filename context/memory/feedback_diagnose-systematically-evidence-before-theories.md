---
id: P-ZQ4CCJR7
type: feedback
title: Diagnose systematically — evidence before theories
created_at: 2026-06-27T13:33:16Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 93cdedcaf9456658a96d94d4e8ba64112c88e271c52429aeb4cc191ced5fc756
related: [open-cmk-mcp-per-tool-prompt-systematic-investigation-pendin, mcp-prompt-two-gate-model-gate-1-server-approval-is-the-unte, mcp-serve-is-long-lived-restart-after-rebuild-or-you-test-st]
---

PROCESS: when diagnosing a hard live bug, stop forming and half-shipping rapid-fire theories ("running around like a headless chicken"). Be systematic: gather evidence FIRST (docs, changelog, observed behavior in a clean state), build an evidence table, form ONE hypothesis, test it, THEN decide. Do not propose a new fix direction every message. A machine restart to clear stale process/lock state is a legitimate clean-slate step before re-testing.

**Why:** During the MCP-prompt diagnosis the agent cycled through multiple unverified theories in quick succession (allow-list, enabledMcpjsonServers in settings.json, then settings.local.json, then user-scope), each presented as the likely fix, several built on a false premise. The user called it out: 'all you did till now was running around like a headless chicken. lets do this systematically.'

**How to apply:** On a hard live bug: (1) collect evidence in a clean/known state, (2) tabulate what actually fires vs what each setting changes, (3) form a single hypothesis grounded in primary-source docs, (4) test that one hypothesis before proposing it as the fix. One investigation thread at a time, not a scatter of theories.
