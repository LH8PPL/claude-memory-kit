---
id: P-NH4Q6EMU
type: project
shape: State
title: 'Memory Viewer Design: Ephemeral Localhost Server'
created_at: 2026-08-02T08:20:45Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 0a6570807ca8ce897386b95976106765645c81b09942716f33bf85eb3231e317
related: [q1-viewer-runtime-model-ephemeral-localhost-pending-ratifica, cmk-view-proposed-wave-1-design, q1-locked-cmk-view-ephemeral-server-architecture]
---

The `cmk view` command is an **ephemeral on-demand localhost server** (not a resident daemon):
- Binds 127.0.0.1 only (refuses non-loopback binding)
- Picks free port automatically, auto-opens browser, terminates on Ctrl-C
- Built with Node stdlib http + embedded HTML/JS (zero heavy deps)
- Implements full-text search as core feature (differentiator: claude-mem's viewer lacks a search box)
- Read-only model; destructive ops route to CLI (e.g., `cmk forget <id>`)

Prior-art research (claude-mem, datasette, PAI Pulse, mdserve) validates ephemeral model: avoids resident-daemon complaints while zero-dep remains proven achievable. Read-only + search-first enforces ADR-0018 + FTS differentiation.

**Why:** Ephemeral lifecycle avoids "viewer won't turn off" complaints that plague daemon-based tools; read-only aligns ADR-0018; search fills a concrete gap in existing viewers; zero-dep preserves kit's lightweight stance.

**How to apply:** Use Node `http.createServer()`, bind port 0 (OS auto-assigns), auto-launch browser via `open()` or `child_process.exec()`. Embed full UI (HTML/CSS/JS) in one committed file. Each search request queries the live FTS index (not a static snapshot).
