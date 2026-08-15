---
id: P-UaE4C5MH
type: project
title: 'Missing `tools: [''*'']` Field Was the Shell Blocker'
created_at: 2026-06-24T19:07:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6195764e6dbe3e9f7808c4e62ae18c24ddeed6f44c667e47bf0cc55c3b0bc021
related: [kiro-cli-agent-tools-field-configuration-fix, tool-execution-in-kiro-cli-requires-tools-config, kiro-cli-agent-config-reads-from-kiro-agents-not-aws-amazonq]
---

The agent config was missing `tools: ['*']`, which prevented the shell tool from being available to the agent during `cmk remember` / `cmk search` execution. Adding this single field unblocked memory persistence. This was the "cut-blocker" that had been preventing prior attempts to eliminate the `--project` machinery.

**Why:** Understanding the root cause prevents regression and explains why prior refactors stalled. The fix is minimal and isolated.

**How to apply:** When next working on agent integration, verify `tools: ['*']` is present in the agent shell config. If shell execution fails silently in future versions, check this field first.
