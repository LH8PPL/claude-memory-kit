---
id: P-NT3M2GYT
type: project
title: 'ZERO-popup route: steer capture to Bash cmk CLI (allow-listed, same safe path) not the MCP tools'
created_at: 2026-06-27T17:30:04Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 462a064462dfa58db9f707450994fe0ce25fe17ce7968118d93a73103add1cf1
related: [resolved-from-file-gives-shell-proof-and-popup-free-capture, allowed-tools-history-task-108-introduced-the-mcp-popup-task, best-fix-permissionrequest-hook-auto-approving-mcp-cmk-keeps]
---

THE ROUTE TO ZERO POPUPS (CC 2.1.195, 2026-06-27): the popups exist because the kit tells Claude to PREFER the MCP tools, which CC gates with an unsuppressable per-tool prompt. The prompt-free alternative is ALREADY in place: Bash(cmk:*) IS allow-listed (Bash prefix rules persist + suppress, unlike MCP rules), and `cmk remember` (the CLI) routes through the EXACT SAME memoryWrite safe path as mk_remember (the MCP tool) — same Poison_Guard/dedup/home-path-abstraction/schema (subcommands.mjs:33 memoryWrite, line 937 "same deferral as mk_remember"). So `cmk remember "..."` via Bash = prompt-free + identical result. THE CAUSE of the popups: the memory-write SKILL.md description literally says "preferring the cmk MCP tools (mk_remember/mk_forget/mk_trust) when connected, falling back to the cmk CLI" — this STEERS Claude to the MCP tool (popup) over the Bash CLI (no popup). The MCP tools were preferred for structured params (no shell-quote escaping of backtick/$()-heavy rationale, the D-81 concern), but they cost the unsuppressable CC popup. CANDIDATE FIX for true zero-popup: flip the skill's preference to the Bash cmk CLI (Bash(cmk:*) allow-listed) instead of MCP — OR drop the MCP tools from the agentic capture path entirely and rely on Bash CLI + the automatic Stop-hook. TRADE-OFF to weigh: shell-quoting of quote/backtick-heavy --why/--how (the D-81 reason MCP was preferred) — mitigated by `cmk remember --from-file fact.json` (the existing D-81 off-shell path). Decide in Task 172: the kit's whole promise is ZERO prompts, and the Bash CLI path delivers that while MCP cannot on 2.1.195.

**Why:** The user's actual goal is no popup at all, not one-click. The MCP per-tool popup is unsuppressable on 2.1.195, but Bash(cmk:*) is allow-listed and cmk remember writes through the identical safe path — so steering capture to the CLI instead of MCP achieves true zero-popup. The skill currently steers to MCP, which is the root of the popups.

**How to apply:** Task 172 candidate: change the memory-write skill to prefer Bash `cmk remember` (allow-listed, prompt-free) over the MCP tools, OR remove the MCP tools from the agentic capture path. Handle quote-heavy rationale via the existing `cmk remember --from-file fact.json` (D-81). Keep the automatic Stop-hook path (already zero-popup). Remove allowed-tools from SKILL.md only if the skill no longer needs to pre-grant MCP tools. Verify on a fresh folder that capture is fully popup-free.
