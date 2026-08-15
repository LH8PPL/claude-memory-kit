---
id: P-J3GFMTAQ
type: project
title: Task 172 live-verified from packed kit (no popup) — full suite + stress green — shipping
created_at: 2026-06-28T04:35:33Z
write_source: user-explicit
trust: high
source_file: user-explicit
source_line: 1
source_sha1: eba8930bedcb3c39442f8ecc1183bf049b50b54c0b65391121ffab10fea8e43f
related: [blocker-claude-exe-windows-incompatible-after-cc-update-live, solved-permissionrequest-hook-mcp-cmk-skill-prompt-free-capt, confirmed-enabledmcpjsonservers-cmk-narrow-form-prompt-free]
---

Task 172 FULLY VERIFIED + shipping (2026-06-28): the PermissionRequest auto-approve hook is live-proven from the PACKED artifact. Chain: packed lh8ppl-claude-memory-kit-0.4.1.tgz (with cmk-approve-permission bin + approve-permission.mjs, 128 files) → npm i -g → fresh folder cut-gate-v041m → default `cmk install` AUTO-WIRED everything with NO hand-edits (PermissionRequest [mcp__cmk__.* + Skill] → cmk-approve-permission, enabledMcpjsonServers:[cmk], all kept layers) → stated "always run black before committing, save it" → mk_remember ran and saved (id P-PZA6Q2KD, feedback_run-black-before-commit.md) with NO POPUP (user confirmed "no pop up"). Full suite 2378/2378 GREEN with live Haiku + stress 5/5 PASS. Two-pass reviewed (code-review-excellence found+fixed the isKitSkill defense-in-depth hole). ENV FIX along the way: the 4 live-smoke failures were a broken npm-global claude.exe (Windows-incompatible after the CC update) — fixed by `npm uninstall -g @anthropic-ai/claude-code` + a claude.cmd shim in .local/bin forwarding to the working native claude.exe (the native install lacks claude.cmd which the tests default to). NOT a kit bug. Shipping: PR → merge → resume v0.4.1 cut-gate → tag.

**Why:** The prompt-free fix is proven end-to-end from the shipped artifact (packed → installed → default install auto-wires → no-click capture), with the full suite + stress green and the two-pass review complete. This closes the whole-day diagnosis and clears Task 172 to merge.

**How to apply:** Merge Task 172, flip the live-verify checkbox in tasks.md, then resume the v0.4.1 cut-gate from the verified packed kit and tag. The claude.cmd shim + npm-global-claude removal is an environment fix (not committed to the repo) needed for the live-Haiku smokes on this machine.
