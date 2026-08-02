---
id: P-VMW6GTBM
type: project
shape: State
title: Read-Only Guard Switched to Content Hash Comparison
created_at: 2026-08-02T12:56:12Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 8881cb3aaf0694ca4cf481d3eee61f38ad40562dbfee45c0c168b59bd5788407
---

Read-only enforcement changed from file-path-based checks to content-hash-based comparison; new structural test bans HTML-parsing sinks from viewer page.

**Why:** Path-based guards are bypassable; hashing is more robust. HTML-parsing sinks are an XSS vector in fact rendering.

**How to apply:** Use content hashing for read-only guards, not paths; enforce absence of parsing sinks via structural tests, not prose.
