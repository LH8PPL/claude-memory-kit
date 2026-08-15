---
id: P-NaCR3Y9V
type: project
shape: State
title: Consolidated Doc Validator Architecture
created_at: 2026-07-20T10:24:41Z
write_source: auto-extract
trust: medium
recurrence_count: 1
source_file: auto-extract
source_line: 1
source_sha1: 94ff4aa211c0050785054f42c3d8845291d5d60d36a405bc59aa3d9cfe222e86
related: [documentation-drifts-at-event-boundaries-not-pr-moments, validate-docs-enforces-catalog-consistency]
---

Four independent validators (`validate-references`, `validate-doc-registry`, `validate-doc-completeness`, `validate-index-completeness`) merged into one `scripts/validate-docs.mjs`, driven by `DOCUMENTATION-MAP.md`.

The four validators are now **families** within the single script (reduced validator count from 21 to 18).

New two-direction check in `registry` family: flags both unregistered files AND stale registry entries pointing to non-existent files.

Back-compat: legacy `<!-- validate-references: ignore -->` marker honored forever; no existing doc edits required.

**Why:** D-249 required separating judgment (what to check) from machinery (how to check). This consolidation unified the judgment layer into one per-change walk while keeping overlapping machinery as four families.

**How to apply:** Treat `scripts/validate-docs.mjs` as the canonical doc validation entry point. When adding new doc validators, consider whether they fit as a new family inside this script.
