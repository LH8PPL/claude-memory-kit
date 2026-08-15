---
id: P-FCN3SZZR
type: project
title: Kiro + CMK Setup Checklist (Pre-Session-1)
created_at: 2026-06-22T18:38:36Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: de574e43a9765d3fce6beb648fd8f3486229f3caea6ca639b562dc8b5ed3378c
related: [kiro-gate-testing-workflow, kiro-requires-full-restart-to-load-updated-hooks, kiro-hook-activation-and-git-commit-cycle]
---

- All file checks passed (cmk doctor 11/11)
- **Action**: Close and reopen Kiro IDE to load `.kiro\hooks\` + `.kiro\settings\mcp.json`
- After restart, open `C:\Temp\kiro-gate`
- IDE hooks active: KH1 (capture fires on agentStop), KH2 (inject), KH3 (exit 0)
- `context\sessions\now.md` will record turnsas you go

**Why:** Hooks are file-written but not loaded in IDE until restart; must restart to activate capture layer.

**How to apply:** Close Kiro, reopen, open workspace; begin Stage 0 build. Paste `context\sessions\now.md` after turn 1–2 to verify KH1 capture is running.
