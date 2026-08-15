---
id: P-P49LTJYC
type: project
title: 'RESOLVED: --from-file gives shell-proof AND popup-free capture — no MCP-vs-Bash trade-off'
created_at: 2026-06-27T17:31:43Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 0bf2253400fdb0ea2e88da7fa3ba6e5904f030b02ab438e22967be4bb8edf27b
related: [zero-popup-route-steer-capture-to-bash-cmk-cli-allow-listed, answered-mcp-per-tool-allow-does-not-persist-across-sessions, best-fix-permissionrequest-hook-auto-approving-mcp-cmk-keeps]
---

SHELL-ESCAPING TRADE-OFF RESOLVED (2026-06-27): the worry that steering capture to Bash cmk CLI (to avoid the unsuppressable MCP popup) would reintroduce the D-81 shell-quote-mangling bug is UNFOUNDED — the kit already has a shell-proof CLI path: `cmk remember --from-file fact.json` (subcommands.mjs:988-1010; channel = --from-file or --json stdin). The fact JSON is written to a FILE and only the FILENAME is passed on the command line, so the shell never sees the backtick/$()/quote-heavy content — D-81-safe — AND it runs via Bash(cmk:*) which is allow-listed, so NO popup. So there are THREE capture paths and the trade-off is false: (a) cmk remember "text" (Bash, no popup, but quotes/backticks mangle = D-81 unsafe for rich text); (b) cmk remember --from-file fact.json (Bash, NO popup, SHELL-PROOF — best of both); (c) mk_remember MCP (shell-proof but UNSUPPRESSABLE popup on 2.1.195). The MCP path's only advantage (structured params) is fully matched by --from-file, WITHOUT the popup. The skill currently documents --from-file as the D-81 fallback (SKILL.md:78-82) but STEERS to MCP first. ZERO-POPUP FIX (Task 172): re-steer the memory-write skill to prefer the Bash cmk CLI — plain `cmk remember "..."` for simple facts, `cmk remember --from-file fact.json` for quote/backtick-heavy rich facts — and STOP preferring the MCP tools for capture. Then both the skill popup (remove allowed-tools, no longer needs to grant MCP tools) AND the MCP popup disappear. Net: capture fully prompt-free AND shell-safe, no trade-off. Automatic Stop-hook path remains prompt-free (in-process writeFact).

**Why:** The shell-escaping concern was the only real reason to keep the popup-causing MCP path; the kit's existing --from-file path is both shell-proof (D-81-safe) and popup-free (Bash allow-listed), eliminating the trade-off and clearing the way to a fully prompt-free capture design.

**How to apply:** Task 172: re-steer memory-write skill to the Bash cmk CLI — plain cmk remember for simple text, cmk remember --from-file fact.json for rich/quote-heavy facts — and drop the MCP-preferred steering + allowed-tools. Verify fully popup-free on a fresh folder. The automatic Stop-hook path is already prompt-free.
