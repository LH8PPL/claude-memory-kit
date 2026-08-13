---
id: P-J4LZZ2YG
type: project
title: Backup Location and Naming Convention
created_at: 2026-06-19T21:06:05Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: f71252d3205ae7c223df79b158adc884e0e1dd1d88ad24573cb64221fc3ef370
related: [release-git-choreography-memory-release-tag-in-order, current-gate-artifact-v0-5-0-with-task-148-and-sonarcloud-fi, cut-gate-sandbox-isolation]
---

Development backups stored at `~\` (not temp) with naming pattern `before-cut-gateN-vX.Y.Z-.claude-memory-kit`, where N is the cut-gate number and X.Y.Z is the version. Examples in use: `before-cut-gate17-v0.3.4-.claude-memory-kit`, `before-cut-gate16-v0.3.3-`, `before-cut-gate-0.3.3-`, `before-cut-gate-0.3.2-`

**Why:** Keeps versioned persona snapshots organized and easily findable during cut-gate testing and version comparisons; establishes a durable artifact location outside transient temp directories

**How to apply:** When creating backups during development, use this location and follow the naming pattern; backups can then be reliably found across sessions
