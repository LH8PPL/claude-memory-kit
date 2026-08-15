---
id: P-3F7L7JZ4
type: project
shape: State
title: 'Kiro IDE Hook Architecture Gap: Missing Capture-Prompt on UserPromptSubmit'
created_at: 2026-07-09T06:52:47Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 081602abbe3ef618f91552e5ff6e448e53518316cfa6054186c725d14f8e206e
related: [claude-code-hook-activation-requires-restart, kiro-vs-claude-code-integration-the-core-is-shared-verified, claude-code-vs-kiro-hook-architecture-difference]
---

**Current configuration:**
- `cmk-capture.json` → Stop event → captures assistant turn only
- `cmk-inject.json` → UserPromptSubmit event → injects (recalls) ONLY

**Gap:** UserPromptSubmit never captures the user prompt (whereas Claude Code's UserPromptSubmit does both inject and capture-prompt)

**Result:** User turns are never written to the session turn file → auto-extract has no user turn to extract from

**Fix:** Add capture-prompt leg to Kiro IDE's UserPromptSubmit hook. `capturePrompt` is already wired in the dispatcher (seen as `wrappedCapturePrompt` in `kiro-hook-bin.mjs`); just needs to be invoked on the IDE's userPromptSubmit event.

**Why:** This fully explains why auto-extract never observes `write_source: auto-extract` facts; it's not that the parser fails or dedup prevents saves—the user turn is simply never captured at the hook layer.

**How to apply:** When evaluating Kiro IDE completeness or planning fixes, reference this known gap. The fix is contained, TDD-able, and respects the documented hook history.
