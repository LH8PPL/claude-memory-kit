---
id: P-FM4YBQNC
type: project
title: Kiro V3 hooks redesigned; first-class delete-guard fallback to shell-approval
created_at: 2026-06-24T09:08:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d1309c1fc51852c9d8a6d6aa80375f56a8bd1fbb2faf9318c56acbd007e7eef4
related: [kiro-cli-v3-hook-redesign-guard-dormant-fallback-active, kiro-cli-v3-delete-guardrail-pretooluse-known-limitation, final-kiro-cli-v3-redesigned-hooks-pretooluse-superseded-by]
---

Kiro V3 (2.9.0+) broke the hook architecture, replacing it with `permissions.yaml`-based approval. The kit's native delete-guard (first-class integration) does not fire on kiro-cli V3; fallback is kiro-cli's built-in shell-approval prompt. Claude Code and IDE guardrails unaffected (they use different surfaces). First-class V3 hook support is deferred to Task 166.

**Why:** Breaking platform change; scopes v0.4.0 functionality and expectation. Honest limitation worth documenting rather than shipping broken behavior.

**How to apply:** When testing kiro-cli, expect native shell approval (not branded cmk guard). Do not file as a bug; reference Task 166 as the planned fix.
