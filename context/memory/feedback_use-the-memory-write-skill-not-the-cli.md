---
id: P-35QY3Ka7
type: feedback
title: use the memory-write skill not the cli
created_at: 2026-06-25T13:31:40Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 6df23222af3140423e833abded4b8f08f5bba1d86186fc3d41f2686b9b93f14e
related: [use-mcp-mk-remember-not-bash-cli, zero-popup-route-steer-capture-to-bash-cmk-cli-allow-listed, resolved-from-file-gives-shell-proof-and-popup-free-capture]
---

Capture facts in conversation via the memory-write skill / mk_remember MCP tool — NOT by shelling out to `node bin/cmk.mjs remember` in Bash.

**Why:** The user noticed the agent used Bash (`node bin/cmk.mjs remember`) instead of the kit's own memory-write skill / mk_remember MCP tool. Both reach the same safe write path, but the skill/MCP is the intended in-conversation capture mechanism — using the kit's own surface is the whole point (dogfooding + it's exactly what a real user's agent does). Shelling out also risks shell-mangling of backtick/quote-heavy rationale, which the structured MCP params avoid.

**How to apply:** When the user says "remember / note / save / from now on / we decided" (or a durable preference/decision/env fact arises), invoke the memory-write Skill — it prefers the mk_remember MCP tool when the cmk server is connected and falls back to the CLI internally. Never type the cmk CLI by hand for a normal in-conversation capture. (Driving the CLI directly is fine only for gate-testing/verifying CLI behavior, not for capturing.)
