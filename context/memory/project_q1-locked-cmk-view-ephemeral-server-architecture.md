---
id: P-2aFXDV2M
type: project
shape: State
title: 'Q1 Locked: cmk view Ephemeral Server Architecture'
created_at: 2026-08-02T08:29:20Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 3e278252012af97c8f970c47e92fcb2fab0a658a5b723bf5b4fc6784f78d6205
---

`cmk view` launches an ephemeral localhost server with:
- Loopback-only binding (127.0.0.1)
- Auto-selected free port
- Auto-opens browser on startup
- Live data (real-time memory state)
- Lifecycle: Ctrl-C to exit

**Why:** User affirmed this approach on 2026-08-02 after evaluating options; it's the committed implementation direction

**How to apply:** Use this specification when implementing cmk view startup, port selection, browser launch, and lifecycle management
