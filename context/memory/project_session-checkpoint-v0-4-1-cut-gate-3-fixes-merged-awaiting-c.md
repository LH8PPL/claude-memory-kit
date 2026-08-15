---
id: P-HGAQN79P
type: project
title: SESSION CHECKPOINT v0.4.1 cut-gate — 3 fixes merged, awaiting CC update retest
created_at: 2026-06-27T07:10:22Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 5c256cd20c428ada16f67b2cd0765fd0654cc9563020a710b89de21c5fb43111
related: [cc-update-does-not-fix-mcp-prompt-task-171-validated, cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools, fresh-folder-verification-workflow-for-claude-memory-kit-rel]
---

SESSION CHECKPOINT (2026-06-27, context near-0%): v0.4.1 cut-gate IN PROGRESS, 3 fixes MERGED to main. Task 169 (#238): Skill(name:*) form. Task 170 (#239): --with-semantic verifies embedder IMPORT not npm exit. Task 171 (#240, the headline): mcp__cmk__* wildcard stopped auto-approving per-tool on CC 2.1.x → KIT_ALLOW now writes each specific mcp__cmk__<tool> (11 from MCP_AUTO_APPROVE). All on main (945abc1), suite 2346/2347 (1 flake). Docs: D-209/210/211, Tasks 169/170/171, CHANGELOG [0.4.1], memory P-BU4L6RGR/P-EEFMZVXB/P-L5WHXB9H. OPEN PROCESS NOTE (the user's correction): I shipped Task 171 WITHOUT consulting the user first — should have asked. CRITICAL NEXT-STEP PLAN (the user's, in order): (1) the user UPDATES Claude Code (a new CC update is available — it MIGHT fix the skill/MCP prompt entirely, making Task 171 moot or confirming it). (2) create a FRESH test folder. (3) test whether the CC update alone fixes prompt-free capture, OR whether Task 171's specific-tool-names fix is still needed. Do NOT re-pack/re-test until the user updates CC. NOT YET TAGGED — v0.4.1 tag is the LAST step after the gate fully passes prompt-free.

**Why:** Context at 0% / auto-compact imminent. The v0.4.1 gate found 3 real prompt-free/install bugs (all merged) but is NOT done: the user is about to update Claude Code, which may fix the skill/MCP prompt at the source — so we must retest on a fresh folder before deciding whether Task 171 is even needed. Durable-state-first so the next session resumes exactly here.

**How to apply:** Next session pickup: (1) confirm the user updated CC (ask the version). (2) re-pack the fixed cmk (npm pack + install-g the 0.4.1 tgz) ONLY if proceeding. (3) fresh folder cut-gate-v041e, cmk install --with-semantic, code. (4) test: does a direct mk_remember run PROMPT-FREE on the updated CC? If yes on the updated CC even WITHOUT Task 171, note that 171 is belt-and-suspenders (still correct, keep). If still prompts, 171 is load-bearing. Watch for the one-time workspace-trust dialog (expected, accept once) vs the per-tool 'proceed with mcp__cmk__mk_remember?' prompt (the bug). Do NOT ship further fixes without consulting the user first (P-process correction this session).
