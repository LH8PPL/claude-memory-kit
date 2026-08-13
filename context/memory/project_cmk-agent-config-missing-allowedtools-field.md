---
id: P-PU3PXTLS
type: project
shape: Absence
title: cmk Agent Config — Missing allowedTools Field
created_at: 2026-07-06T17:59:27Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: e5960a510c23ed7ff6512d48b167420a55bc0245185b673a3f6090170a27fd5f
related: [test-anti-pattern-setup-commands-masking-automation, missing-tools-field-was-the-shell-blocker, first-time-mcp-server-approval-in-claude-code]
---

During testing, cmk agent showed `allowedTools: MISSING` where prior setup (D-196) specifies `["@cmk"]`. If genuinely missing, MCP calls would prompt even when cmk is active.

**Why:** cmk is intended to be the auto-approve agent, but missing `allowedTools` in its config would prevent MCP auto-approval. This is a configuration regression.

**How to apply:** Before shipping, verify cmk agent config file contains `"allowedTools": ["@cmk"]`. If missing, restore per D-196.
