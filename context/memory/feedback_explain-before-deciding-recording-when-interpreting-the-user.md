---
id: P-N7XT4F7Y
type: feedback
shape: State
title: 'Explain BEFORE deciding/recording: when interpreting the user''s answers into dur'
created_at: 2026-07-17T15:15:23Z
write_source: user-explicit
trust: high
recurrence_count: 1
source_file: user-explicit
source_line: 1
source_sha1: dd38caaf76344e0829a7720d5d399fcc0a9d7fb9eb02b86b5c9789741bcdf6f2
related: [always-fix-markdown-lint-warnings-md022-blanks-around-headin, resume-fact-convention-capturing-uncommitted-code-intent, memory-auto-injection-on-session-start]
---

Explain BEFORE deciding/recording: when interpreting the user's answers into durable state (memory writes, tasks.md edits, trigger changes, commits), first lay out in plain text what is about to be decided and what stays open — THEN act. The user's 2026-07-17 correction: 'can you please explain before you decide things?' came after answers were recorded+committed before the plan was explained.

**Why:** Acting on an interpretation of the user's words without confirming the interpretation risks encoding a misreading into the durable record; the user wants the read-back first

**How to apply:** Before any commit/memory-write that encodes a user choice: state what was understood, what will be recorded, what stays open; give a beat for correction; then write. Autopilot covers code mechanics, not interpretations of the user's intent
