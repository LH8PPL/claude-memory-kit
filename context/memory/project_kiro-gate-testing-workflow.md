---
id: P-XaK442KW
type: project
title: Kiro Gate Testing Workflow
created_at: 2026-06-22T18:41:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 50281a237d462728c1d1eb9606d0a848834080ac8ffa441cd36d648cb231a65d
related: [automated-capture-via-agentstop-hook, kiro-cmk-setup-checklist-pre-session-1, d-303-test-environment-confirmed-ready]
---

- **Setup:** Restart Kiro (§1 hooks + MCP load), open `C:\Temp\kiro-gate`
- **Execution:** Run 4 stages in Kiro IDE; state each *Say* preference out loud (NOT "remember this")
- **Turns:** End each turn normally so `agentStop` capture hook fires automatically
- **Verification:** Paste `context\sessions\now.md` after 1–2 turns; verify **KH1** test passes (automated capture, no manual intervention)

**Why:** KH1 is the core live validation — ensures memory capture is fully automated via hooks, requiring no manual memory syntax in user utterances

**How to apply:** Execute 4-stage sequence as stated; state preferences naturally; allow hooks to fire at end-of-turn; check context\sessions\now.md to confirm KH1 success
