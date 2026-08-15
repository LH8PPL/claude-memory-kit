---
id: P-DXPCKAUU
type: project
shape: Event
title: MCP tools under-used when harness defers them - Task 233 fire-rate evidence
created_at: 2026-07-21T20:08:05Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: bf1716460974c48b988805f4ee575ebe072a3a10ef26e2afed9f5bf9196b100c
related: [kit-identity-a-harness-over-the-harness-the-user-s-framing, mcp-prompt-two-gate-model-gate-1-server-approval-is-the-unte, use-mcp-mk-remember-not-bash-cli]
---

Live dogfood observation (2026-07-21, this dev session): the agent shelled out to `node packages/cli/bin/cmk.mjs` for EVERY memory operation all session and never reached for the mk_* MCP tools unprompted — the user caught it. Three compounding causes, all mechanical: (1) this session's harness DEFERS the mcp__cmk__* tools — using one requires a ToolSearch schema-load step first, while Bash is always loaded, so the cheap door wins every time; (2) the live-test rule ("always the current repo code, never the installed global") correctly biases toward the dev-tree binary on THIS repo, but it generalized into a session-wide habit covering memory writes too; (3) nothing in the per-prompt surface nudges the MCP door specifically. This is capture-side evidence for the Task 233 fire-rate concern: the recall/capture trigger design assumes the model reaches for the kit's tools when the harness makes them frictionless, and a harness that defers them breaks that assumption invisibly.

**Why:** The kit's model-facing design (skills, MCP tools, per-prompt hints) presumes the tools are in the agent's active tool set. A deferred-tools harness adds a load step that silently redirects the agent to shell habits — the under-fire class (D-40/D-153) at the TOOL-SELECTION layer rather than the recall layer. Without this recorded, the next fire-rate analysis would miss that harness tool-loading policy is a variable.

**How to apply:** When measuring skill/tool fire-rates (D-122 trend, Task 233), record whether the session's harness pre-loads or defers the mk_* tools — the two populations are not comparable. For dev sessions on this repo, CLI-via-dev-tree remains correct for LIVE-TESTING; for routine memory writes either door is fine, but note which was used and why.
