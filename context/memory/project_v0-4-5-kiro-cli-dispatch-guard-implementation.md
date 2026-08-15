---
id: P-C6JYB72G
type: project
shape: Event
title: v0.4.5 kiro-cli dispatch guard implementation
created_at: 2026-07-06T17:21:42Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: f2b1608ca6d611a0dda24d8658f690f3d03993f8d30f16e0e0378e61247c4cff
related: [v0-4-5-agent-relative-llm-backend-feature, d-197-end-to-end-live-re-test-workflow, claude-code-2-1-x-needs-skill-name-wildcard-to-suppress-skil]
---

Two changes in v0.4.5:
1. **`kiro-hook-dispatch.mjs`**: added recursion guard `if (env.CMK_BACKEND_SPAWN) return noop`. Activates when kit spawns kiro-cli as LLM backend. In normal user sessions (env var absent), guard is no-op → behavior unchanged from June.
2. **`kiro-hook-command.mjs`**: added `cursorHookCommand()` function (Cursor support; doesn't affect Kiro path).

The dispatch guard is a **real change to the live inject/capture path**. Unit-tested in v0.4.5 (`cli-kiro-hook-dispatch.test.js`), not live-re-tested this cut.

**Why:** Dispatch path changed, so June live-test proof doesn't fully cover v0.4.5 kiro-cli. Exemplifies "unit-green ≠ works-on-real-input" principle the project warns against.

**How to apply:** For current-cut kiro-cli confidence, run Kiro live gate (exercises dispatch with guard in real session). IDE hooks untouched; June IDE proof stands.
