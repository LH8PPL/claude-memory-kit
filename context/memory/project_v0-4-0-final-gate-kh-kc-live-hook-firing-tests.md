---
id: P-ZC7V6VV7
type: project
title: v0.4.0 final gate — KH/KC live hook-firing tests
created_at: 2026-06-22T13:12:15Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: d3464ed49de9a3a61407d1d08dca83cdd255c0d29ca200b9eff06a31440cfe63
related: [plan-the-user-2026-06-21-do-the-manual-kiro-live-capture-tes, cut-gate-kiro-deliberately-tests-both-kiro-clients-across-th, live-test-gate-structure-and-blocker-findings]
---

Two groups of tests that unit tests cannot reach:
  - **KH1–KH3**: Open `C:\Temp\kiro-gate` in Kiro IDE, run Session-1 build arc, verify `agentStop` captures a turn and `promptSubmit` injects.
  - **KC1–KC4**: Run `kiro-cli chat` (no `--agent`), verify default resolves, `agentSpawn`/`stop` fire, MCP reachable.

**Why:** These test whether hooks actually fire in the real IDE/CLI — cannot be unit-tested.

**How to apply:** After artifact rebuild, drive KH and KC sequences in Kiro. All must pass before cutting v0.4.0.
