---
id: P-BDJHESCB
type: project
title: CHANGELOG Script Assertion — Non-Unique Anchor Gotcha
created_at: 2026-06-11T04:41:53Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 03a0eb6af67ffcf6c7038d794e8d2dd17b6102c7
related: [powershell-utf-8-corruption-in-changelog-handling, vbs-launcher-quirk-for-hidden-scheduled-task-windows, d-343-kit-lacks-mechanism-to-repair-stale-scaffolded-skills]
---

The CHANGELOG build script asserts when an anchor is not unique. When chaining multiple edits (e.g., CHANGELOG entry + task-checkbox flip), a failed assertion can be masked if the command sequence doesn't halt on first error; the commit proceeds with incomplete file updates.

**Why:** Silent script failures are easy to miss in automated workflows; this is a recurring gotcha.

**How to apply:** After chained automated edits, verify the commit's file count matches expectation by reading the actual commit file list. Never trust exit codes; inspect the actual diff to catch masked failures. Redo the commands with proper error handling (single invocations per logical step, or explicit error traps).
