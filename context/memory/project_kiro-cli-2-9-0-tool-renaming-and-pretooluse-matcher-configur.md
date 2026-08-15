---
id: P-6JXPBCLV
type: project
title: kiro-cli 2.9.0 Tool Renaming and preToolUse Matcher Configuration
created_at: 2026-06-24T07:13:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 010dba8a755583f8d1385b6a8f7e7ff9346826f479c63630756779c5b8c3ab82
related: [d198-proven-agentspawn-fires-but-pretooluse-not-on-2-9-0-exe, final-kiro-cli-v3-redesigned-hooks-pretooluse-superseded-by, kg-guard-failed-matcher-pipe-alternation-not-literal]
---

**Tool rename:** kiro-cli 2.9.0 renamed the shell execution tool from `execute_bash` → `execute_command`.

**Documentation lag:** Official kiro-cli docs still reference `execute_bash`, but the actual binary uses `execute_command`.

**preToolUse hook matcher:** The hook matcher must use the actual tool name. In 2.9.0, setting `matcher: execute_command` (not `'*'` or `execute_bash`) is required for preToolUse to fire on shell commands.

**Status:** D-198 agentSpawn/capture/inject logic is proven. preToolUse matcher fix is pending user confirmation via a fresh `ls` command test.

**Why:** The hook location fix (D-198) was confirmed correct, but hooks weren't firing because the matcher didn't align with the actual 2.9.0 tool name. This explains the discrepancy between docs and runtime behavior.

**How to apply:** When setting up kiro-cli guards and hooks in v2.9.0+, use the literal tool name (`execute_command`) in matchers, not documented names. Sync matcher names against actual kiro-cli output, not docs.
