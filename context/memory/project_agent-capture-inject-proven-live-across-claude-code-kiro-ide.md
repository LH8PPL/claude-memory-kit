---
id: P-NSAE3H4P
type: project
title: Agent capture/inject proven live across Claude Code, Kiro IDE, and kiro-cli
created_at: 2026-06-24T09:08:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 342b73c41afc3e6ecee3885d728c3e9e49ddfec402a1b55d4f35d94c45b63e37
related: [d198-shipped-pr225-kiro-cli-capture-inject-proven-live, kiro-v3-hooks-redesigned-first-class-delete-guard-fallback-t, task-50-n-completion-state-kiro-parity-campaign]
---

D-198 (config location fix) validates agentSpawn end-to-end. Three surfaces confirmed: Claude Code (capture+inject ✅, guardrail ✅) | Kiro IDE (capture+inject ✅, native confirm) | kiro-cli (capture+inject ✅, shell-approval fallback). Two-pass code review + full suite 2260/0.

**Why:** Confirms core functionality works; unblocks v0.4.0 finalization after E1 (cold-open) and KU1/KU2 (uninstall flows).

**How to apply:** Use this status table when deciding v0.4.0 readiness. Proceed to E1 + KU flows; restore real tiers from run4 backup; push v0.4.0 tag once CLI is green.
