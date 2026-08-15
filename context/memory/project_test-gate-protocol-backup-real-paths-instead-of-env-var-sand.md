---
id: P-GVYE3WV9
type: project
title: Test-Gate Protocol — Backup Real Paths Instead of Env-Var Sandbox
created_at: 2026-06-21T14:17:27Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: af1fa0718e57883c90221ec45504ee6f1c0614498269d7f84ca3d7303e83283c
related: [cut-gate-backup-convention, kiro-cli-agent-config-goes-to-aws-amazonq-cli-agents-amazon, never-overwrite-backups]
---

**Goal**: Test kiro CLI against real user directories (not env-var sandboxed), so the gate catches real-world path bugs and proves the default behavior works.

**Protocol**:
1. **Before gate**: Back up `~/.claude-memory-kit/` (Move) and `~/.aws/` (Copy — creds-sensitive).
2. **During gate**: Run all tests against real paths — no MEMORY_KIT_AWS_DIR / MEMORY_KIT_USER_DIR env vars.
3. **After gate**: Preserve test artifacts in backup folder as evidence, then restore originals.
4. **Restore `.aws` special case**: Delete only the cmk agent files added (`q_cli_default.json`, `cmk.json`); never move/remove the whole dir (would break concurrent AWS tools).

**Open**: Verify kiro-cli actually reads `~/.aws/amazonq/cli-agents/` (per D-182), not `~/.kiro/`.

**Why:** Testing real default paths catches real-world bugs that env-var sandboxing hides — the same principle as the "test real input" rule.

**How to apply:** Rewrite cut-gate-kiro.md; strip all MEMORY_KIT_AWS_DIR / MEMORY_KIT_USER_DIR refs; add backup-real-restore protocol section.
