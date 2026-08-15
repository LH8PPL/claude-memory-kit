---
id: P-aAPTRPN4
type: project
title: Release Lane Independence Pattern
created_at: 2026-06-30T07:48:56Z
write_source: auto-extract
trust: medium
source_file: auto-extract
source_line: 1
source_sha1: ad46c0fbb21f41e9ca4d14d7bb1c7a2c579c783d506f7ffac40f0757bd9ffe4b
related: [d-157-rule-version-assignment-at-shipment, tag-ready-criterion-core-features-pass-known-issues-cleanly, documentation-map-spine-drifts-while-decision-log-stays-curr]
---

Tasks can ride the same release lane without being merged into each other.
- Each task maintains its own tasks.md entry, design sections, decision-logging, and ADR, even when shipping in the same release.
- "Sharing a release lane" does NOT mean "merging tasks"; independence is preserved through separate documentation and ownership.
- Example: Tasks 70.4 and 74 are separate, independently-documented tasks both riding v0.4.3.

**Why:** Allows efficient release batching (multiple independent features per version) while maintaining clear traceability, decision ownership, and accountability per task.

**How to apply:** When multiple independent tasks ship in one release, keep their documentation (ADRs, design sections, decision logs) separate. Don't merge small tasks just to fill a release; instead, ride them.
