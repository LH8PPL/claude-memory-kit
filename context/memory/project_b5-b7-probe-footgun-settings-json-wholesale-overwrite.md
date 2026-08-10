---
id: P-TaHaDQV7
type: project
title: B5/B7 Probe Footgun — settings.json Wholesale Overwrite
created_at: 2026-06-10T20:08:52Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: 033f19c9872cf3d9103999286b4bfedc30e312c6
related: [release-gate-structure-v0-3-0, avoid-duplicating-authoritative-docs-in-temp-locations]
---

B5/B7 probes in release validation overwrite `settings.json` wholesale. Footgun documented in cut-gate.md v0.3.0 release notes.

**Why:** Running B5/B7 in a working directory (not throwaway) corrupts configuration.

**How to apply:** Always run B5/B7 probes in temporary/throwaway directories only. Never in shared or production-like directories.
