---
id: P-XXHHNAMD
type: project
title: AWS guardrail sample repo as reference for task 166 investigation
created_at: 2026-06-24T11:16:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5c4894999d02f590e19e60a6f22ff318ceab627682b8395941e2df7b6c26d6e2
related: [aws-official-kiro-cli-sample-reference-for-task166-v3-guardr, kiro-cli-v3-delete-guardrail-pretooluse-known-limitation, fresh-cmk-install-health-baseline-cmk-0-4-5-with-semantic]
---

The github.com/aws-samples/sample-kiro-cli-multiagent-development repository contains working preToolUse guardrail hooks in embedded format. Designated as canonical reference for Task 166 (V3 guardrail follow-up). Approach: clone the repo and diff AWS's working preToolUse hooks against the project's 2.9.0 implementation to determine whether issues are format differences or version-specific regressions.

**Why:** The project's V3 guardrail hooks may have format issues or be broken on 2.9.0. AWS's official working example provides a baseline for comparison to identify root cause.

**How to apply:** For Task 166 startup, save the AWS repo link. Clone it and perform side-by-side diff of preToolUse hooks against 2.9.0 implementation. Document findings as format issue vs. 2.9.0 regression.
