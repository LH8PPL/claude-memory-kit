---
id: P-WH4B9VPD
type: project
title: kiro-cli MCP server env passing limitation
created_at: 2026-06-24T15:13:41Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6023fe0fd73b7f19c7987915034360c606e3b1d3b9a1618f257911abcb3046ad
related: [kiro-cli-env-only-flows-for-registry-type-not-stdio-mcp-feed, kiro-cli-env-passing-limitation, kiro-cli-project-workaround-for-project-path-passing]
---

kiro-cli's env override behavior differs by MCP server type:
- **Registry-type servers**: env overrides flow to the process
- **stdio-type (personal) servers**: env is silently dropped

The kit's server is stdio-type, so `CMK_PROJECT_DIR` never reaches the MCP process. Secondary issue: kiro sometimes launches with cwd=HOME, which breaks walk-up fallback to context/.

**Scope**: Only affects explicit `mk_remember` tool calls within kiro. CLI hooks (agentSpawn + stop) work independently and continue to capture memory.

**Why:** Root cause of MCP capture failures in kiro v0.4.0. The blocking issue is upstream in kiro-cli, not in the kit's code (which was correct).

**How to apply:** When debugging mk_remember failures in kiro, verify server type. If stdio, env won't reach it. Two paths forward: (1) check if kit can register as registry-type to flow env, (2) document as v0.4.0 limitation and rely on CLI hooks as workaround.
