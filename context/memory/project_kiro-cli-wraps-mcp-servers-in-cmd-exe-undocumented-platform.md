---
id: P-ZDBaD7AT
type: project
title: kiro-cli wraps MCP servers in cmd.exe (undocumented platform behavior)
created_at: 2026-06-24T11:16:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: c1cad7371380846e38b626f6437e1d9070a58b428a0d4f3e77b1d41f88489827
related: [kiro-cli-custom-agent-tool-limitation, hc-9-drift-after-claude-code-update-v0-3-4, kiro-cli-mcp-trust-model-and-kit-s-workaround]
---

kiro-cli has undocumented platform behavior that automatically wraps all MCP server processes in cmd.exe windows. These windows remain visible during chat sessions. No configuration option exists to disable this behavior. Verified by evaluating AWS documentation, community guides, and official AWS sample repos — none provide a configuration workaround.

**Why:** Users and developers may initially interpret the cmd.exe popup as a bug or misconfiguration issue. Identifying it as inherent platform behavior prevents wasted investigation and explains why configuration-level fixes don't exist.

**How to apply:** Document as known-issue for v0.4.0 release notes. When users report cmd.exe windows or debugging involves them, reference this as platform limitation (not a deployment/configuration problem). No further investigation needed.
