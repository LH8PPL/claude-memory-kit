---
id: P-LQ7WZKHN
type: project
shape: Timeless
title: Gate CLI-detection checks on research findings to prevent false positives
created_at: 2026-07-05T14:04:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f04783ead3c73617ef2f202ffad7ed5c466db249d6dcf2385a4d255ce3325a09
related: [windows-npm-eperm-warning-on-better-sqlite3-node-is-benign, codemem-validates-multi-cli-auto-detect-approach-in-producti, mcp-prompt-root-cause-agent-config-kiro-cli-mismatch]
---

Do not implement CLI-detection logic (in `cmk install` or `cmk doctor`) before researching how each agent is actually deployed on each platform.
- **Risk example**: assuming "Windows Cursor users have cursor-agent on PATH" produces false "CLI is missing" warnings if users actually use WSL or a community binary
- **Why it matters**: a false positive is worse than no check — it damages user trust and blocks correct setups
- **Apply to**: Task 200 (shared `agentCliOnPath(kind)` detector) and any future install/doctor checks

**Why:** Unvalidated platform assumptions risk producing false positives on correct installations, blocking users with valid setups; pre-research implementation prevents encoding environment-specific assumptions as universal truth

**How to apply:** Complete Wave 0 research (how each agent is deployed, CLI locations, environment setup per platform) before wiring detector logic for install-time or health-check warnings
