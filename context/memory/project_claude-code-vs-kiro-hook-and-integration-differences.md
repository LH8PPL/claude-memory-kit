---
id: P-GVUWGQKL
type: project
title: Claude Code vs Kiro Hook and Integration Differences
created_at: 2026-06-21T10:39:22Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 5b4f7407bf59d3df4a435cad96401891f0d01b85f9c8aedc514b32155c660c8b
related: [kiro-vs-claude-code-integration-the-core-is-shared-verified, kiro-hook-environment-verified-live-2026-06-21-the-probe-cap, kiro-transcript-format-resolved-verified-on-a-real-kiro-inst]
---

These differences are architectural necessities (discovered during live-testing), not arbitrary divergence:
- **Hook config**: Claude Code uses `.claude/settings.json` hooks array; Kiro uses `.kiro/hooks/*.kiro.hook` files with `when`/`then` properties
- **Hook input**: Claude Code sends stdin as JSON payload; Kiro passes argv + env(USER_PROMPT) + cwd + transcript file path
- **Transcript storage**: Claude Code at `~/.claude/projects/<slug>/<session>.jsonl`; Kiro at `globalStorage/.../workspace-sessions/<base64url>/<id>.json`
- **Command form**: Claude Code runs bare bin; Kiro runs `cmd.exe /c cmk hook stop` (WSL wrapper on Windows)
- **Skills directories**: `.claude/skills/` vs `.kiro/skills/`

**Why:** Each agent has a different plugin/integration API and execution context; these differences are fundamental to how each tool works

**How to apply:** Accept these as necessary constraints. Do not attempt to unify them. Focus integration work on the thin adapter layer that bridges agent-native I/O to the shared core
