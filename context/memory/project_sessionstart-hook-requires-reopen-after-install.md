---
id: P-FBEWVLQC
type: project
shape: Timeless
title: SessionStart Hook Requires Reopen After Install
created_at: 2026-07-03T18:32:57Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 4292dfc85f3fb86b60dcdb2beba555a2da2fa80119dbab47867d61898d54679f
related: [claude-code-hook-activation-requires-restart, sessionstart-hook-activation-narrow-restart-caveat, memory-kit-hooks-are-project-scoped]
---

When installing claude-memory-kit, the SessionStart hook that injects the persona snapshot only loads if Claude Code is fully quit and reopened **after** running `cmk install`. Sessions opened before or during installation will not load the hook.

**Why:** D-262 lesson; prerequisite for persona injection to work, critical for E1 (cold-open) testing where persona must carry unprompted to new projects

**How to apply:** After `cmk install --with-semantic`, fully quit and restart Claude Code before testing new projects. Do not rely on persona injection if the session started before the install completed.
