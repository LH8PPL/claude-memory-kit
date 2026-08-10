---
id: P-4ZNAMQM9
type: project
title: 'allowed-tools history: Task 108 introduced the MCP popup; Task 69 original was Bash-CLI-only (prompt-free)'
created_at: 2026-06-27T17:58:30Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: e46a6e615d2388e6e126ac144822274e0ccc492cb9b3971dcbaa9b06d70dfc32
related: [zero-popup-route-steer-capture-to-bash-cmk-cli-allow-listed, q1-popup-is-a-cc-2-1-x-change-not-a-kit-regression-q2-allowe, complete-design-one-permissionrequest-hook-mcp-cmk-skill-mat]
---

allowed-tools HISTORY (memory-write SKILL.md, 2026-06-27 git trace): the MCP-popup behavior was INTRODUCED by Task 108, not original. Evolution: (1) ca71f4d [69] skill created with allowed-tools = `Bash(cmk remember *) Bash(cmk forget *) Read` — BASH CLI ONLY, no MCP tools → this version was PROMPT-FREE by design (Bash rules suppress). (2) 562454d [108] "Unify CLI+MCP" ADDED `mcp__cmk__mk_remember mcp__cmk__mk_forget` to allowed-tools AND changed the skill description to "prefer the MCP tools when connected" → THIS commit introduced the popup behavior (MCP tools in the grant + steering toward them; MCP per-tool prompts are unsuppressable on CC 2.1.195). (3) 5b9c1bb [117] added mcp__cmk__mk_trust + Bash(cmk trust *) (last functional change to the line). (4) b5f37a6 [D-195] + e45c583 [164] = YAML/lint fixes only, no tool changes. IMPLICATION: the ORIGINAL Task-69 design (Bash CLI only) was already the zero-popup answer; Task 108's MCP-preference is what created the problem. This strengthens the steer-back-to-Bash-CLI option (it's a RESTORE of the original prompt-free design, not a downgrade) — though the PermissionRequest hook (the user's idea, being tested in v041l) keeps the MCP path AND kills the popup, which is the best-of-both. NOTE: 4 copies of each SKILL.md exist — template/ (canonical), packages/cli/template/ (auto-mirror at pack), plugin/skills/ (separate, edit manually), .claude/skills/ (dogfood); currently all byte-identical (md5 02c958...). Any Task 172 skill change must touch template/ + plugin/skills/ for both memory-write AND memory-search.

**Why:** Tracing when allowed-tools changed shows the MCP-popup behavior is not original — Task 108 added MCP tools to the skill grant and steered toward them. The original Task 69 skill was Bash-CLI-only and prompt-free, which reframes the Bash-CLI fix as a restore rather than a downgrade and confirms where any skill edit must land (4 copies).

**How to apply:** Task 172: whichever fix wins (PermissionRequest hook keeping MCP, or steer-back-to-Bash-CLI restoring the Task-69 design), apply skill edits to template/ + plugin/skills/ for BOTH memory-write and memory-search; packages/cli/template/ auto-syncs at pack. The hook fix goes in settings-hooks.mjs (one write-site). All 4 SKILL.md copies currently identical (md5 02c958...).
