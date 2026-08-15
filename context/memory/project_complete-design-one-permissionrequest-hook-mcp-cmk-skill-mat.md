---
id: P-4HQTBYFK
type: project
title: 'COMPLETE design: one PermissionRequest hook (mcp__cmk__.* + Skill matchers) kills both popups, documented mechanism'
created_at: 2026-06-27T18:12:26Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 226a655fbafb342398fd543b7be5abd2aacfe74b78ce1b9ae0be75fcd9450b8f
related: [best-fix-permissionrequest-hook-auto-approving-mcp-cmk-keeps, solved-permissionrequest-hook-mcp-cmk-skill-prompt-free-capt, root-cause-skill-md-allowed-tools-frontmatter-triggers-the-a]
---

COMPLETE zero-popup design (CC 2.1.195, 2026-06-27): ONE PermissionRequest hook can kill BOTH popups. Docs line 623: PermissionRequest matcher matches the TOOL NAME (examples: Bash, Edit|Write, mcp__.*); line 389 confirms it fires for ExitPlanMode (a non-Bash/non-MCP tool) — so it matches ANY tool name including the Skill tool. So the "Use skill?" popup (the Skill tool requesting permission) AND the mcp__cmk__ popup can BOTH be auto-approved by PermissionRequest hooks. DESIGN: hooks.PermissionRequest with TWO matchers — (a) matcher "mcp__cmk__.*" → auto-approve the kit's MCP tools (kills MCP popup); (b) matcher "Skill" (or scoped to memory-write/memory-search) → auto-approve the kit's skill (kills skill popup). Each emits {"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}}. SAFETY: use a kit bin (cmk-approve-mcp style, mirroring cmk-guard-memory) that reads the tool name from stdin and only emits allow if it's mcp__cmk__* OR memory-write/memory-search — double-layer (narrow matcher + bin self-check), so even a loose matcher can't approve a non-kit tool. This uses ONLY the documented PermissionRequest mechanism, NOT the buggy skill allowed-tools (#17499/#18837). So Task 172 = (1) PermissionRequest hook for both mcp__cmk__.* and the kit skills, wired in settings-hooks.mjs; (2) remove allowed-tools from SKILL.md (it's buggy+unreliable for MCP per #17499, and removing it also independently clears the skill popup per changelog 3140 — but the hook covers it either way); (3) keep enabledMcpjsonServers:[cmk] (server gate). VERIFY LIVE on a fresh folder: both popups gone. v041l currently tests only the mcp__cmk__.* matcher (skill still has allowed-tools) — next iteration adds the Skill matcher.

**Why:** Docs confirm PermissionRequest matches any tool name including Skill, so a single hook mechanism can auto-approve both the MCP popup and the skill popup — using the documented auto-approve path, not the buggy allowed-tools surface. This is the complete zero-popup design for Task 172.

**How to apply:** Task 172: wire PermissionRequest hooks for matcher mcp__cmk__.* AND the kit skills (Skill / memory-write / memory-search) via a self-checking kit bin in settings-hooks.mjs; remove allowed-tools from SKILL.md (buggy per #17499; hook covers it); keep enabledMcpjsonServers:[cmk]. Verify both popups gone on a fresh folder.
