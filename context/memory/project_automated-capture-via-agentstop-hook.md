---
id: P-N6WZLTVT
type: project
title: Automated Capture via agentStop Hook
created_at: 2026-06-22T18:41:03Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6527161c5d9bf427c3aeae39815b90ab75ec0e1e3400420df3b76b9e8d31b7a6
related: [kiro-gate-testing-workflow, kiro-cli-automatic-memory-capture-works, cross-project-rules-auto-promote-at-session-end-stop-hook]
---

The `agentStop` hook should fire automatically at the end of each turn. Preferences stated out loud; do not prefix utterances with "remember this" or memory commands — the hook will capture durable facts automatically.

**Why:** Core test of automation: hook must work without polluting user utterances with memory syntax

**How to apply:** Speak preferences naturally within Kiro stages; let hook fire at end-of-turn; verify capture in context\sessions\now.md (hook should have fired; facts extracted and waiting for review)
