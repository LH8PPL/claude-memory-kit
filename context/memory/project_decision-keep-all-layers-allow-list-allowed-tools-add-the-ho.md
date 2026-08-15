---
id: P-BQ57723C
type: project
title: 'DECISION: keep all layers (allow-list + allowed-tools) + ADD the hook — defense-in-depth, future-proof for CC bug fixes'
created_at: 2026-06-27T18:17:41Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 52ab892d3dc4dc4990e639f72e3029b6eb388381b7772f9c3d675503dfe283de
related: [cc-2-1-x-mcp-server-wildcard-does-not-auto-approve-mcp-tools, best-fix-permissionrequest-hook-auto-approving-mcp-cmk-keeps, solved-permissionrequest-hook-mcp-cmk-skill-prompt-free-capt]
---

DECISION (the user, 2026-06-27): KEEP EVERYTHING added — defense-in-depth + future-proofing. The kit's install (Task 172) writes ALL of: (1) NEW: PermissionRequest hooks [matcher mcp__cmk__.* + matcher Skill] — the WORKING prompt-free fix (auto-approve, live-proven v041l). (2) NEW: enabledMcpjsonServers:["cmk"] — the server-approval gate (real, works). (3) KEEP: permissions.allow = Bash(cmk:*) + Skill(memory-write)+:* + Skill(memory-search)+:* + mcp__cmk__* + all 11 specific mcp__cmk__ names (Task 169+171). (4) KEEP: the skill's allowed-tools frontmatter (do NOT remove it). RATIONALE (the user): the allow-list + skill allowed-tools are HARMLESS belt-and-suspenders, and "maybe everything that worked till now and the rest we added will work someday" — when Claude Code fixes its known bugs (#17499 allowed-tools-for-MCP undocumented/unreliable, #14956/#18837 allowed-tools-not-enforced cluster, the 2.1.x wildcard tightening), these rules START working natively and the kit becomes prompt-free WITHOUT needing the hook. So nothing is removed; the hook is what makes it prompt-free TODAY, the rest is correct + activates when CC catches up. This REVISES the earlier 'remove allowed-tools' idea (P-aDFRNUMD) and the 'steer to Bash CLI' idea (P-NT3M2GYT) — keep the MCP path AND all the layers; add the hook on top. Task 172 = additive only.

**Why:** The user chose to keep every rule added (allow-list + skill allowed-tools) as harmless belt-and-suspenders that will activate natively once Claude Code fixes its known allowed-tools/wildcard bugs, and add the PermissionRequest hook as the working fix today. Additive, not subtractive — keeps the superior MCP path and future-proofs.

**How to apply:** Task 172: settings-hooks.mjs writeKitHooks ADDS PermissionRequest hooks (mcp__cmk__.* + Skill) + enabledMcpjsonServers:[cmk]; KEEP all existing permissions.allow entries and the SKILL.md allowed-tools (do not remove). Revises P-aDFRNUMD (remove allowed-tools) and P-NT3M2GYT (steer to Bash) — superseded by keep-all-plus-hook. Live-verify on fresh folder.
