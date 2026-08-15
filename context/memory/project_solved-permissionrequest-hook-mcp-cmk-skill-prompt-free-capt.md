---
id: P-MYNFF2PW
type: project
title: 'SOLVED: PermissionRequest hook (mcp__cmk__.* + Skill) = prompt-free capture, live-proven on 2.1.195'
created_at: 2026-06-27T18:15:02Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: 703e048b41029a94406f039ee621051a257032cf72c8585ee1a784f8e5a739fa
related: [best-fix-permissionrequest-hook-auto-approving-mcp-cmk-keeps, complete-design-one-permissionrequest-hook-mcp-cmk-skill-mat, decision-keep-all-layers-allow-list-allowed-tools-add-the-ho]
---

SOLVED + LIVE-PROVEN (cut-gate-v041l, CC 2.1.195, 2026-06-27): the PermissionRequest hook (the user's idea) WORKS — it auto-approves the kit's tools so capture is prompt-free. Test: fresh folder with hooks.PermissionRequest = two matchers [mcp__cmk__.*, Skill] each emitting {"hookSpecificOutput":{"hookEventName":"PermissionRequest","decision":{"behavior":"allow"}}} via a cross-platform node -e one-liner, plus enabledMcpjsonServers:[cmk], skill left untouched (allowed-tools kept). Stated "always run black before committing, save it" → the popup "popped up then went away really fast" (= the documented hook behavior: dialog briefly renders, hook answers allow, it dismisses) → fact SAVED with NO user click. Proof on disk: context/memory/feedback_run-black-before-committing.md created; audit.log shows action:created, writeSource:user-explicit, trust:high. So PermissionRequest auto-approve DOES fire on 2.1.195 and DOES suppress both the MCP and skill permission prompts (functionally prompt-free — no interaction, no block). MINOR COSMETIC CAVEAT: the dialog flashes briefly before the hook dismisses it (renders-then-auto-answers); functionally prompt-free but not visually invisible. THIS IS THE TASK 172 FIX: wire PermissionRequest hooks (matchers mcp__cmk__.* + Skill, ideally via a self-checking kit bin that only approves cmk tools/skills) in settings-hooks.mjs writeKitHooks at install + repair --hooks, alongside enabledMcpjsonServers:[cmk]. Keeps the superior MCP path (structured params), uses ONLY documented mechanism (not the buggy allowed-tools per #17499/#18837), narrow+safe scope, persists across sessions (it's a hook). Decision-trail: supersedes Task 171 (permissions.allow MCP entries — ineffective for the popup) as the real prompt-free fix.

**Why:** This is the resolution of the whole-day prompt-free hunt: the user's PermissionRequest hook idea, live-proven on a fresh folder, auto-approves both the MCP and skill popups so capture completes with no click — using the documented hook mechanism (not the buggy allowed-tools), keeping the MCP path, safely scoped, and persistent across sessions.

**How to apply:** Task 172: wire PermissionRequest hooks (matchers mcp__cmk__.* + Skill, via a self-checking kit bin approving only cmk tools/skills) in settings-hooks.mjs writeKitHooks (install + repair --hooks); keep enabledMcpjsonServers:[cmk]. Note the minor cosmetic dialog-flash. Two-pass review, live-verify on fresh folder, then ship in v0.4.1. Re-frame Task 171 in DECISION-LOG as superseded.
