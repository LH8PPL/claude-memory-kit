---
id: P-CLSAGTMK
type: project
shape: Timeless
title: MCP prompt gate only appears in non-default agent scenario
created_at: 2026-07-06T19:15:58Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: d14adcaf5f9bb732ba01b8d6f278662d70f026a6dedb26027bd716286e44940f
related: [mcp-prompt-root-cause-agent-config-kiro-cli-mismatch, task-165a-is-design-decision-linked-to-d-285-not-mechanical, kit-shell-permission-command-trust-boundary]
---

**cmk-default path:** cmk config has `includeMcpJson: false` → no MCP load, steers to pre-trusted shell commands (cmk remember/cmk search). Normal users on this path never see approval popup.

**Non-default path (e.g., kiro_default):** cmk is not active, project MCP loads, reaches for `mk_remember` → triggers approval prompt. One click accepts; documented behavior for non-default agents.

Implication: the prompt you see is expected *only* when cmk is not your global default. Normal users are unaffected.

**Why:** Distinguishes real bugs from configuration artifacts. Clarifies why you hit the gate (engineered non-default state) but an end user won't (on cmk-default).

**How to apply:** When investigating memory prompts or approval gates: check agent config first. If cmk-default, no gate. If non-default, gate is expected and should be addressed via design decision (not a quick patch).
