---
id: P-H7DV3JR9
type: project
shape: Timeless
title: Install-Path Review Checklist
created_at: 2026-07-25T09:18:28Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: a7e69a3d33b219d66f464e41c00af0d9e5faf0a622ef50d009e50858384a77d8
related: [js-yaml-can-silently-rewrite-yaml-formatting]
---

Install-path changes (recovery scan, installer safety logic) must pass heightened reviewer scrutiny on:
- **Byte-preservation**: No silent reformatting; validate with hostile YAML test cases and full diffs
- **Fail-open completeness**: Recovery can warn but never break an install; every throw surface is covered
- **Double-reindex cost**: No-op installs must not pay unnecessary re-indexing overhead
- **Tombstone and superseded resurrection guards**: Collisions skip rather than overwrite; deleted facts stay deleted
- **Windows junction loops**: Scan handles OS symlink loops without infinite loops
- **Implementer-authored log entries**: Log claims must be validated against the diff to ensure accuracy

**Why:** Install-path code is fail-open (safety-critical); a latent bug breaks recovery at the user's site. The recovery scan can warn but never destroy, must preserve byte-identity and dates/ids, and must skip collisions rather than overwrite.

**How to apply:** Apply this checklist for any install-path work. For byte-preservation, diff before/after with hostile YAML. For fail-open, trace all throw surfaces. For Windows junctions, test on Windows or mock scenarios.
