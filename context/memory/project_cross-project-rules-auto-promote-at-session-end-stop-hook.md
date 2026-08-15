---
id: P-H4KXTZTX
type: project
title: Cross-Project Rules Auto-Promote at Session End (Stop Hook)
created_at: 2026-06-24T20:37:02Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 8016745d321f49fdeb2366068913d1b4234c0d62e7f167db8daa6b90f6ed30b2
related: [kiro-cli-automatic-memory-capture-works, b3-b4-wedge-test-workflow-cross-project-doctrine-capture-val, automated-capture-via-agentstop-hook]
---

The claude-memory-kit automatically promotes cross-project doctrine (rules marked "in every project" or "from now on always") to the user tier (HABITS.md) at session end via the stop hook. Mechanism: session-end-tasks.mjs runs `autoPersona` on the stop hook, which reads the per-turn fact corpus and auto-promotes cross-project rules. This is the designed primary path; explicit `cmk lessons promote` mid-session is an optional alternative.

**Why:** Understanding the auto-promotion flow prevents confusion: users don't need manual promotion commands to land cross-project rules in HABITS.md. The kit handles promotion automatically at session close, reducing friction.

**How to apply:** Capture cross-project rules normally with `cmk remember`. Exit the kiro-cli session to fire the stop hook. Auto-promotion to HABITS.md happens automatically—no manual `cmk lessons promote` needed.
