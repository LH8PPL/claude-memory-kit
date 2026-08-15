---
id: P-NBWU27JQ
type: project
title: Kiro-cli automatic memory capture works
created_at: 2026-06-24T18:20:57Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 6976ada782cb82172bdd61d335cd19ea858a0fa232221553e115f0df8dbb48cc
related: [automated-capture-via-agentstop-hook, cross-project-rules-auto-promote-at-session-end-stop-hook, memory-auto-injection-on-session-start]
---

- **Capture (automatic):** the gate4 hook captures sessions without user action; evidence: now.md written with 3641 bytes in the tested kiro session
- **Inject/recall mechanism:** agentSpawn hook fires at session start and should recall memory automatically
- **Status:** automatic capture is proven; end-to-end recall injection still needs verification before fully claiming it
- **Why it matters:** the core value of claude-memory-kit (memory without manual intervention) is intact in kiro-cli, even if manual save is broken

**Why:** The whole point of the kit is "fire and forget" memory across sessions; this is the feature that matters most and the one that works

**How to apply:** When using kiro-cli, rely on automatic memory capture/recall (just works); don't attempt manual "remember this" commands (they fail due to kiro bug). Next session should verify end-to-end recall actually injects facts into conversation context.
