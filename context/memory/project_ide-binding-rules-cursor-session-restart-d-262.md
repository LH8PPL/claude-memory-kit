---
id: P-79P92Y9F
type: project
shape: Timeless
title: 'IDE Binding Rules: Cursor Session Restart (D-262)'
created_at: 2026-07-04T07:15:08Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 20caca1ceb4bf8618ab1fcb0863fd65d5da7f78bcbd03433cb1e0a92b8cb0ddc
related: [sessionstart-hook-activation-narrow-restart-caveat, kiro-gate-testing-workflow, kiro-requires-full-restart-to-load-updated-hooks]
---

**Cursor (VS Code fork):** Hooks load at session start, so "fully quit + reopen Cursor after install, before any live check" is a ★★ binding rule
- A pre-install session falsely reads as "hook didn't fire" even if it was installed
- v0.4.4 gate hit this trap; now a standing requirement for Cursor testing

**Why:** Cursor inherits VS Code's session lifecycle; older sessions won't load post-install hooks

**How to apply:** Document this in platform-specific gates in bold; enforce full IDE quit+reopen before running live checks
