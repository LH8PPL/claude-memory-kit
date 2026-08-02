---
id: P-TLPMa5CD
type: project
shape: Plan
title: 'Q1: Viewer Runtime Model — Ephemeral Localhost (Pending Ratification)'
created_at: 2026-08-02T08:26:17Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a2bcfcec2da8776f956e6ab2a81bb303003f571b398f2e28946471ce1bec0de3
---

**Problem:** How should `cmk view` work at runtime?

**Candidates considered:**
- (a) Ephemeral localhost server (recommended) — starts on demand, no daemon, live data, datasette-style, binds to localhost, picks free port, opens browser, Ctrl-C kills it
- (b) Static HTML export — frozen snapshot baked at generation time, no server overhead, but search/status stale
- (c) Terminal UI — no browser dependency, but wrong medium for non-developer audience and poor for graphs/timelines

**Selected approach:** (a) ephemeral localhost server

**Reasoning:**
- No background daemon to manage or forget (unlike claude-mem, Pulse which have daemon-management issues)
- Live search, health status, graph queries are the point vs. static export
- Target audience: non-developer browser user, not terminal dweller
- Datasette-style lifecycle: starts on demand, serves while in use, vanishes on stop

**Status:** Pending user ratification

**Why:** This foundational architectural decision determines build strategy, deployment model, lifecycle management, and UX flow for the entire viewer feature.

**How to apply:** Use as north star for all viewer implementation. Confirm with user before build starts. If shape must change, cascade updates to downstream decisions (server binding, port selection, browser automation, lifecycle management).
