---
id: P-DPULJZ33
type: project
shape: State
title: '"Restart Claude Code after install" is NOT a blanket rule; only applies to a nar'
created_at: 2026-07-03T18:43:53Z
write_source: auto-extract
trust: high
recurrence_count: 1
source_file: auto-extract-session
source_line: 1
source_sha1: 9ca580170d8cb5b6a9a213e7ce1912a82865accff1d02135b103b06acef07dea
related: [sessionstart-hook-activation-narrow-restart-caveat, sessionstart-hook-requires-reopen-after-install, claude-code-only-prompts-for-permissions-vlc9d4ya]
---

"Restart Claude Code after install" is NOT a blanket rule; only applies to a narrow corner case (install into an already-open window). A session opened after install completes already has the SessionStart hook on disk.
