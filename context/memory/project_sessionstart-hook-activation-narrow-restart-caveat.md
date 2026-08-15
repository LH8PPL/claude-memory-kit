---
id: P-7WTLTNRS
type: project
shape: Timeless
title: SessionStart Hook Activation — Narrow Restart Caveat
created_at: 2026-07-03T18:43:53Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 5bcbc6d1d7538eb87d34e6a1732ced4d45b1baacfc87ffd74bea2afbec9a4de2
related: [restart-claude-code-after-install-is-no-dpuljz33, sessionstart-hook-requires-reopen-after-install, mcp-server-may-retain-stale-code-in-memory-after-package-upd]
---

**When restart is needed:** `cmk install` or extension update runs in a terminal window, then Claude Code is opened in the *same* window before the session loads the updated hook. In this case, a full restart (quit + reopen) is necessary.

**When restart is NOT needed:** `cmk install` completes in terminal, *then* a new Claude Code session is opened. The hook is already on disk at SessionStart.

The E1 run followed the second pattern (install, then `code .` in fresh session) — no restart was necessary and the result proved it.

**Why:** Overgeneralized "always restart after install" becomes a nonsensical instruction in the common case (open fresh). The rule should only apply to the corner case (install into already-open window).

**How to apply:** If documenting this caveat, phrase it as a corner case, not a blanket rule. Make clear when restart is actually required vs when it is automatic.
