---
id: P-FYSSUZPL
aliases: [P-FYSSUZPL]
type: project
shape: State
title: CMK View — Memory Viewer Web App
created_at: 2026-08-05T20:39:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 6de1a75822b9949437bd21e414532069859d9121e2f5f54100d33755b82cd399
related: [q1-viewer-runtime-model-ephemeral-localhost-pending-ratifica, cmk-view-proposed-wave-1-design]
---

- **Command:** `cmk view` — starts ephemeral localhost browser for read-only memory store viewer
- **File location:** `C:\Projects\claude-memory-kit\packages\cli\src\viewer-page.html`
- **Architecture:** Single static HTML file with all CSS and JS inline (tests enforce this)
- **Content:** Displays ~2,300 facts (P/L/U tier, trust level, date, source); fact graph; health page; decisions journal
- **Lifecycle:** Starts on demand, dies on Ctrl-C

**Why:** Concrete project structure and constraints for viewer maintenance and redesign

**How to apply:** Reference for HTML edits, design work, or feature planning on cmk view
