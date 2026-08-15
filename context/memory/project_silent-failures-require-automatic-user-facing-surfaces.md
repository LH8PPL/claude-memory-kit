---
id: P-995L5NHT
type: project
shape: Timeless
title: Silent Failures Require Automatic User-Facing Surfaces
created_at: 2026-07-20T09:34:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 239365d5b67722ac0c92d3780d7983f2b563650e640854e8c0d99d0216c6a7d2
related: [memory-capture-status-emitted-at-session-start, a-health-check-behind-a-command-does-not-surface-a-silent-fa]
---

Silent failures (e.g., memory extractor timeout, missing data) must surface automatically without user action. Users will not run diagnostic commands proactively.

Standard pattern:
- Automatic status-line output during session startup (every session)
- Emitted to user-display channel, not model-facing
- Non-verbose when healthy; shows detail when problematic

Doctor/diagnostic tools can coexist but serve power users, testing/gates, not the load-bearing surface.

**Why:** Users don't proactively run diagnostics; silent failures go unnoticed if surfaced only on-demand. Automatic subsystems must have default-safe, always-on visibility.

**How to apply:** Ensure failures surface in the user-display path every session (startup, context injection, etc.), not behind optional diagnostic commands. Diagnostic tools are additive, not primary.
