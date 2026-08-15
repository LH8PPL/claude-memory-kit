---
id: P-92a5DQTJ
type: project
shape: State
title: D-303 Test Environment Confirmed Ready
created_at: 2026-07-09T07:56:30Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 7b82758da436f29d9c3b12913b7937cb3a9201f2be1c41191668525847905881
related: [memory-persistence-validation-workflow-end-to-end, d-303-fixed-kiro-auto-extract-user-prompt-empty-recovered-fr, cmk-install-kiro-setup-commands]
---

`C:\Temp\kiro-ide-gate10` is the designated folder for the D-303 auto-extract re-test.
- Baseline: 6 pass · 0 fail · 5 skip (HC-1 and HC-11 PASS; HC-4 shows 0 fact files)
- Main CI: 0 failures (not blocking)
- Next step: run live Kiro test (state casual preference → turn ends → auto-capture fires → verify via `cmk search`)

**Why:** Confirms which folder to use; baseline cleanliness validates it's a fresh slate where any facts appearing after the test are unambiguously from auto-extract, not prior state.

**How to apply:** Run the Kiro re-test in this folder as outlined in previous notes; **do NOT run `cmk remember`** — the fix in v0.5.0 hooks should auto-capture the stated preference on turn-end.
