---
id: P-9D56CKBV
type: project
title: 'PR Organization: Separate IDE (PR-1) and CLI (PR-2) Surfaces'
created_at: 2026-06-21T08:33:34Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f6ab108c5f5c66eccd850df99cc6877072bb0ceb31dfb391f6394ddf9eb51204
related: [kiro-install-contains-two-independent-clients-with-separate, disable-mcp-in-ide-wrappers-with-includemcpjson-false, cmk-install-scaffolding-and-wiring]
---

PR-1 (IDE hooks, ✅ complete) covers `cmk install --ide kiro` wiring (MCP, steering, skills, IDE hooks with platform-correct cmd.exe activation). PR-2 (CLI hooks, planned) will cover CLI hook configuration in agent JSON. They are separate PRs because the surfaces differ fundamentally: location (`.kiro/hooks/` vs agents), activation (automatic vs default-agent), and audience (IDE vs CLI users).

**Why:** IDE and CLI integration require different documentation and config models. Separating them maintains clear scope and prevents review confusion. IDE is now production-ready and deployable independently.

**How to apply:** When designing multi-surface tools, structure PRs by surface boundary, not internal component. This split serves as a precedent for IDE vs CLI or similar multi-audience integrations.
