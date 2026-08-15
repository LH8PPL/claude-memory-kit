---
id: P-CTERUG3C
type: project
shape: State
title: Kiro CLI MCP Trust Model and Kit's Workaround
created_at: 2026-07-13T08:04:19Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5f0c9cf30a6e06698e0d7b0d67e29168899735dd9c10e7f36c14b3366706c88d
related: [mcp-prompt-root-cause-agent-config-kiro-cli-mismatch, kiro-cli-auto-loading-verified-d-181-follow-up-kiro-dev-docs, claude-code-vs-kiro-hook-architecture-difference]
---

**The platform gap:** Kiro's IDE has `autoApprove` setting for auto-trusting memory tools; Kiro's CLI ignores this by design (GitHub issue #4672 confirms intent).

**Kit's workaround:** Creates custom agent `cmk` and sets it as terminal default, eliminating prompts for most users.

**Remaining cases:** Users with pre-existing terminal defaults. Kit won't overwrite their choice (defensive), so they see one prompt per session.

**Platform limit:** No config can pre-trust tools for an agent kit doesn't control (#4384 testing confirms). This is a Kiro limitation, not a kit defect.

**User workaround:** `kiro-cli agent set-default cmk` achieves zero prompts.

**Why:** Clarifies MCP prompts are Kiro behavior, not kit bug. Determines whether to pursue kit-side fixes (none available) or document limitation + user workaround.

**How to apply:** Add to kit's MCP troubleshooting docs. Consider install-time hint for users with pre-existing defaults, guiding them to the `kiro-cli` command.
