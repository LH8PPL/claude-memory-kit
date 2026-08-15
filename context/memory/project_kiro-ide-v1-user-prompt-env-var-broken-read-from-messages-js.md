---
id: P-65N46V47
type: project
shape: State
title: Kiro IDE v1 USER_PROMPT env var broken; read from messages.jsonl instead
created_at: 2026-07-09T07:01:44Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: c47f8c6674dcb51f6e4a84aceea5517c84e859341c83127031a3959a34e712e6
related: [kiro-ide-hook-architecture-gap-missing-capture-prompt-on-use, correction-kiro-capture-prompt-wiring-is-present-not-missing, kiro-cli-env-passing-limitation]
---

- **Diagnosis confirmed:** Kiro IDE 1.0 platform bug—`UserPromptSubmit` hook unreliable, `USER_PROMPT` env var empty/malformed (GitHub issues #9619, #6188, #7375, #4620)
- **Current impact:** Kit's capture path relies on `USER_PROMPT` → auto-extract fails on Kiro IDE
- **Workaround available:** Kit already has `parseKiroIdeV1Messages()` to extract user turn from `messages.jsonl` transcript
- **Fix strategy:** Route user-turn capture through transcript instead of broken env var
- **Known caveat:** Timing unresolved—whether transcript is available when Stop hook fires

**Why:** Auto-extract is the kit's headline feature; broken on Kiro IDE 1.0. Diagnosis now sourced and confirmed. Workaround is feasible and under kit's control. Blocks shipping per D-292.

**How to apply:** Modify Kiro IDE capture path to use `parseKiroIdeV1Messages` to read user turn from `messages.jsonl`. Verify transcript is populated when Stop hook executes.
